const Invitation = require('../models/Invitation');
const { body } = require('express-validator');
const { notifyAllVillagers } = require('../services/notificationService');
const { requireUserVillage, villageFilter } = require('../services/villageScope');

const invitationValidators = [
  body('title').trim().notEmpty(),
  body('message').optional().isString(),
  body('inviteAllVillagers').optional().isBoolean(),
];

async function listInvitations(req, res, next) {
  try {
    const list = await Invitation.find(villageFilter(req.user))
      .sort({ createdAt: -1 })
      .populate('userId', 'name avatar');
    res.json(list);
  } catch (e) {
    next(e);
  }
}

async function createInvitation(req, res, next) {
  try {
    const villageId = requireUserVillage(req.user);
    const { title, message, inviteAllVillagers, media } = req.body;
    const inv = await Invitation.create({
      userId: req.user._id,
      villageId,
      title,
      message: message || '',
      inviteAllVillagers: inviteAllVillagers !== false,
      media: media || [],
    });
    if (inv.inviteAllVillagers) {
      await notifyAllVillagers(
        'Personal invitation',
        title,
        'invitation',
        { invitationId: String(inv._id) },
        villageId
      );
    }
    res.status(201).json(inv);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listInvitations,
  createInvitation,
  invitationValidators,
};
