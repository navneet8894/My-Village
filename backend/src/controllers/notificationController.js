const Notification = require('../models/Notification');

async function listMyNotifications(req, res, next) {
  try {
    const list = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(list);
  } catch (e) {
    next(e);
  }
}

async function markRead(req, res, next) {
  try {
    await Notification.updateMany(
      { userId: req.user._id, _id: { $in: req.body.ids || [] } },
      { $set: { read: true } }
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { listMyNotifications, markRead };
