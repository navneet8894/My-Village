const Family = require('../models/Family');
const User = require('../models/User');
const { body } = require('express-validator');

function buildTree(members, headId) {
  const byId = new Map();
  members.forEach((m) => {
    byId.set(String(m._id), {
      id: String(m._id),
      userId: m.userId,
      displayName: m.displayName,
      relationshipToHead: m.relationshipToHead,
      isHead: m.isHead,
      children: [],
    });
  });
  let rootId = headId ? String(headId) : null;
  if (!rootId) {
    const head = members.find((m) => m.isHead);
    if (head) rootId = String(head._id);
  }
  members.forEach((m) => {
    const node = byId.get(String(m._id));
    const pid = m.parentMemberId ? String(m.parentMemberId) : null;
    if (pid && byId.has(pid)) {
      byId.get(pid).children.push(node);
    }
  });
  const root = rootId && byId.get(rootId) ? byId.get(rootId) : null;
  const orphans = [];
  members.forEach((m) => {
    const node = byId.get(String(m._id));
    if (!m.parentMemberId && String(m._id) !== rootId) {
      orphans.push(node);
    }
  });
  return { root, orphans };
}

async function getMyFamily(req, res, next) {
  try {
    let family = await Family.findOne({ ownerId: req.user._id }).populate(
      'members.userId',
      'name email avatar'
    );
    if (!family) {
      family = await Family.create({
        name: 'My Family',
        ownerId: req.user._id,
        members: [
          {
            userId: req.user._id,
            displayName: req.user.name,
            relationshipToHead: 'self',
            isHead: true,
            parentMemberId: null,
          },
        ],
        headMemberId: null,
      });
      const m0 = family.members[0];
      family.headMemberId = m0._id;
      await family.save();
      family = await Family.findById(family._id).populate(
        'members.userId',
        'name email avatar'
      );
    }
    const plain = family.toObject();
    const tree = buildTree(plain.members, plain.headMemberId);
    res.json({ family: plain, tree });
  } catch (e) {
    next(e);
  }
}

const addMemberValidators = [
  body('userId').optional().isMongoId(),
  body('email').optional().isEmail(),
  body('displayName').optional().trim(),
  body('relationshipToHead').trim().notEmpty(),
  body('parentMemberId').optional().isMongoId(),
  body('isHead').optional().isBoolean(),
];

async function addMember(req, res, next) {
  try {
    const { userId, email, displayName, relationshipToHead, parentMemberId, isHead } =
      req.body;
    let targetUser = null;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase() });
    }
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found — invite them to register first' });
    }

    const family = await Family.findOne({ ownerId: req.user._id });
    if (!family) return res.status(404).json({ message: 'Family not found' });

    const exists = family.members.some(
      (m) => String(m.userId) === String(targetUser._id)
    );
    if (exists) {
      return res.status(400).json({ message: 'Member already in family' });
    }

    const member = {
      userId: targetUser._id,
      displayName: displayName || targetUser.name,
      relationshipToHead,
      parentMemberId: parentMemberId || null,
      isHead: !!isHead,
    };
    family.members.push(member);
    if (isHead) {
      family.members.forEach((m) => {
        m.isHead = String(m.userId) === String(targetUser._id);
      });
      family.headMemberId = family.members[family.members.length - 1]._id;
    }
    await family.save();
    const updated = await Family.findById(family._id).populate(
      'members.userId',
      'name email avatar'
    );
    const plain = updated.toObject();
    res.json({
      family: plain,
      tree: buildTree(plain.members, plain.headMemberId),
    });
  } catch (e) {
    next(e);
  }
}

const setHeadValidators = [body('memberId').isMongoId()];

async function setHead(req, res, next) {
  try {
    const { memberId } = req.body;
    const family = await Family.findOne({ ownerId: req.user._id });
    if (!family) return res.status(404).json({ message: 'Family not found' });
    const m = family.members.id(memberId);
    if (!m) return res.status(404).json({ message: 'Member not found' });
    family.members.forEach((x) => {
      x.isHead = String(x._id) === String(memberId);
    });
    family.headMemberId = m._id;
    await family.save();
    const updated = await Family.findById(family._id).populate(
      'members.userId',
      'name email avatar'
    );
    const plain = updated.toObject();
    res.json({
      family: plain,
      tree: buildTree(plain.members, plain.headMemberId),
    });
  } catch (e) {
    next(e);
  }
}

async function removeMember(req, res, next) {
  try {
    const { memberId } = req.params;
    const family = await Family.findOne({ ownerId: req.user._id });
    if (!family) return res.status(404).json({ message: 'Family not found' });
    const m = family.members.id(memberId);
    if (!m) return res.status(404).json({ message: 'Member not found' });
    if (String(m.userId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot remove yourself' });
    }
    m.deleteOne();
    await family.save();
    const updated = await Family.findById(family._id).populate(
      'members.userId',
      'name email avatar'
    );
    const plain = updated.toObject();
    res.json({
      family: plain,
      tree: buildTree(plain.members, plain.headMemberId),
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getMyFamily,
  addMember,
  addMemberValidators,
  setHead,
  setHeadValidators,
  removeMember,
  buildTree,
};
