const mongoose = require('mongoose');
const Family = require('../models/Family');
const User = require('../models/User');
const { body, param } = require('express-validator');
const { replaceMemberConnections, serializeFamily } = require('../services/familyRelationships');

const handle = action => async (req, res, next) => {
  try { await action(req, res); }
  catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({ message: 'Your family was updated elsewhere. Refresh the family page before saving again.' });
    }
    next(error);
  }
};
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const owns = req => ({ ownerId: req.user._id });

async function ownedFamily(req) {
  const family = await Family.findOne(owns(req));
  if (!family) fail(404, 'Family not found');
  return family;
}
async function respond(res, family, status = 200) {
  await family.populate('members.userId', 'name email avatar');
  res.status(status).json(serializeFamily(family));
}
function changeHead(family, memberId) {
  family.members.forEach(member => { member.isHead = String(member._id) === String(memberId); });
  family.headMemberId = memberId;
}
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
function writeDetails(member, input) {
  for (const key of ['displayName', 'gender', 'phone', 'occupation']) {
    if (has(input, key)) member[key] = input[key];
  }
  if (has(input, 'dateOfBirth')) member.dateOfBirth = input.dateOfBirth || null;
}
function writeRelationships(family, member, input) {
  if (!has(input, 'parentIds') && !has(input, 'spouseId')) return;
  replaceMemberConnections(family, member._id, input);
  if (has(input, 'parentIds') && has(input, 'spouseId')) {
    member.relationshipsReviewed = true;
    member.parentMemberId = null;
  }
}
function detailValidators() {
  return [
    body('displayName').optional().isString().bail().trim().notEmpty().withMessage('Full name is required').isLength({ max: 120 }),
    body('dateOfBirth').optional({ values: 'falsy' }).isISO8601({ strict: true }).bail().custom(value => {
      if (new Date(value) > new Date()) throw new Error('Date of birth cannot be in the future');
      return true;
    }),
    body('gender').optional().isIn(['', 'male', 'female', 'other']),
    body('phone').optional().isString().bail().trim().isLength({ max: 30 }),
    body('occupation').optional().isString().bail().trim().isLength({ max: 160 }),
  ];
}
function connectionValidators() {
  return [
    body('parentIds').optional().isArray({ max: 2 }).withMessage('Select at most two parents'),
    body('parentIds.*').isMongoId().withMessage('Invalid parent'),
    body('parentIds').optional().custom(value => {
      if (Array.isArray(value) && new Set(value).size !== value.length) throw new Error('Choose two different parents');
      return true;
    }),
    body('spouseId').optional({ values: 'null' }).custom(value => value === '' || mongoose.isValidObjectId(value)).withMessage('Invalid spouse'),
  ];
}

const getMyFamily = handle(async (req, res) => {
  let family = await Family.findOne(owns(req));
  if (!family) {
    const memberId = new mongoose.Types.ObjectId();
    family = await Family.create({
      name: 'My Family', ownerId: req.user._id, headMemberId: memberId,
      members: [{
        _id: memberId, userId: req.user._id, displayName: req.user.name,
        relationshipToHead: 'self', isHead: true, relationshipsReviewed: true,
      }],
      connections: [],
    });
  }
  await respond(res, family);
});

const addMemberValidators = [
  body('userId').optional().isMongoId(),
  body('email').optional().isEmail(),
  ...detailValidators(),
  ...connectionValidators(),
  body('relationshipToHead').optional().isString().bail().trim().isLength({ min: 1, max: 60 }),
  body('parentMemberId').optional({ values: 'null' }).isMongoId(),
  body('isHead').optional().isBoolean().toBoolean(),
];

const addMember = handle(async (req, res) => {
  const family = await ownedFamily(req);
  const input = req.body;
  let targetUser = null;
  if (input.userId) targetUser = await User.findById(input.userId);
  else if (input.email) targetUser = await User.findOne({ email: input.email.toLowerCase() });
  if ((input.userId || input.email) && !targetUser) fail(404, 'Registered user not found. Add the member without an account, or ask them to register first.');
  if (!input.displayName?.trim() && !targetUser?.name) fail(400, 'Member name is required');
  if (targetUser && family.members.some(member => String(member.userId) === String(targetUser._id))) fail(400, 'Member already in family');
  if (input.parentMemberId && !family.members.id(input.parentMemberId)) fail(400, 'Related family member was not found');

  family.members.push({
    userId: targetUser?._id || null,
    displayName: input.displayName?.trim() || targetUser?.name,
    relationshipToHead: input.relationshipToHead || 'member',
    parentMemberId: input.parentMemberId || null,
    relationshipsReviewed: has(input, 'parentIds') && has(input, 'spouseId'),
  });
  const member = family.members[family.members.length - 1];
  writeDetails(member, input);
  writeRelationships(family, member, input);
  if (input.isHead || !family.headMemberId) changeHead(family, member._id);
  await family.save();
  await respond(res, family, 201);
});

const updateMemberValidators = [
  param('memberId').isMongoId(),
  ...detailValidators(),
  ...connectionValidators(),
];
const updateMember = handle(async (req, res) => {
  // Account identity, ownership and head status never come from this payload.
  const allowed = new Set(['displayName', 'dateOfBirth', 'gender', 'phone', 'occupation', 'parentIds', 'spouseId']);
  if (!Object.keys(req.body).length || Object.keys(req.body).some(key => !allowed.has(key))) fail(400, 'Only member details, parents and spouse can be edited here');
  const family = await ownedFamily(req);
  const member = family.members.id(req.params.memberId);
  if (!member) fail(404, 'Member not found');
  writeDetails(member, req.body);
  writeRelationships(family, member, req.body);
  await family.save();
  await respond(res, family);
});

const setHeadValidators = [body('memberId').isMongoId()];
const setHead = handle(async (req, res) => {
  const family = await ownedFamily(req);
  const member = family.members.id(req.body.memberId);
  if (!member) fail(404, 'Member not found');
  changeHead(family, member._id);
  await family.save();
  await respond(res, family);
});

const removeMember = handle(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.memberId)) fail(400, 'Invalid member');
  const family = await ownedFamily(req);
  const member = family.members.id(req.params.memberId);
  if (!member) fail(404, 'Member not found');
  if (String(member.userId) === String(req.user._id)) fail(400, 'Cannot remove yourself');
  if (member.isHead || String(family.headMemberId) === String(member._id)) fail(400, 'Choose another family head before removing this member');
  const memberId = String(member._id);
  family.connections = (family.connections || []).filter(edge => String(edge.fromMemberId) !== memberId && String(edge.toMemberId) !== memberId);
  // Legacy references may remain unreviewed, but must not point to deleted members.
  family.members.forEach(other => { if (String(other.parentMemberId) === memberId) other.parentMemberId = null; });
  member.deleteOne();
  await family.save();
  await respond(res, family);
});

function buildTree(members, headMemberId, connections = []) {
  return serializeFamily({ toObject: () => ({ members, headMemberId, connections }) }).tree;
}
module.exports = {
  getMyFamily, addMember, addMemberValidators, updateMember, updateMemberValidators,
  setHead, setHeadValidators, removeMember, buildTree,
};

