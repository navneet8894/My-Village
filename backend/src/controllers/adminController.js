const User = require('../models/User');
const Family = require('../models/Family');
const Village = require('../models/Village');
const VillageNews = require('../models/VillageNews');
const VillageEvent = require('../models/VillageEvent');
const Announcement = require('../models/Announcement');
const { body } = require('express-validator');
const { notifyAllVillagers } = require('../services/notificationService');

async function getStats(req, res, next) {
  try {
    const [userCount, families, postCount, villageCount] = await Promise.all([
      User.countDocuments(),
      Family.find().select('members'),
      VillageNews.countDocuments({ isRemoved: { $ne: true } }),
      Village.countDocuments(),
    ]);
    const totalMembers = families.reduce((sum, f) => sum + (f.members?.length || 0), 0);
    res.json({ userCount, totalMembers, postCount, villageCount });
  } catch (e) {
    next(e);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.find()
      .select('-password -fcmTokens')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    next(e);
  }
}

async function banUser(req, res, next) {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'Not found' });
    if (u.role === 'admin' && String(u._id) !== String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot ban another admin' });
    }
    u.isBanned = true;
    u.banReason = req.body.reason || 'Policy violation';
    await u.save();
    res.json(u);
  } catch (e) {
    next(e);
  }
}

async function unbanUser(req, res, next) {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'Not found' });
    u.isBanned = false;
    u.banReason = '';
    await u.save();
    res.json(u);
  } catch (e) {
    next(e);
  }
}

async function deleteNewsAdmin(req, res, next) {
  try {
    await VillageNews.findByIdAndUpdate(req.params.id, { isRemoved: true });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

const announcementValidators = [
  body('title').trim().notEmpty(),
  body('body').trim().notEmpty(),
];

async function postAnnouncement(req, res, next) {
  try {
    const { title, body: text } = req.body;
    const a = await Announcement.create({
      adminId: req.user._id,
      title,
      body: text,
    });
    await notifyAllVillagers('Announcement', title, 'announcement', {
      announcementId: String(a._id),
    });
    res.status(201).json(a);
  } catch (e) {
    next(e);
  }
}

async function listAnnouncements(req, res, next) {
  try {
    const list = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('adminId', 'name');
    res.json(list);
  } catch (e) {
    next(e);
  }
}

const emergencyValidators = [
  body('title').trim().notEmpty(),
  body('body').trim().notEmpty(),
];

async function emergencyAlert(req, res, next) {
  try {
    const { title, body: text, villageId } = req.body;
    await notifyAllVillagers(title, text, 'emergency', {}, villageId || null);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function listVillages(req, res, next) {
  try {
    const villages = await Village.find().sort({ name: 1 });
    const stats = await Promise.all(
      villages.map(async (v) => {
        const [userCount, postCount, eventCount] = await Promise.all([
          User.countDocuments({ villageId: v._id }),
          VillageNews.countDocuments({ villageId: v._id, isRemoved: false }),
          VillageEvent.countDocuments({ villageId: v._id }),
        ]);
        return {
          ...v.toObject(),
          userCount,
          postCount,
          eventCount,
        };
      })
    );
    res.json(stats);
  } catch (e) {
    next(e);
  }
}

async function getVillageDetail(req, res, next) {
  try {
    const village = await Village.findById(req.params.id);
    if (!village) return res.status(404).json({ message: 'Village not found' });

    const [users, posts, events] = await Promise.all([
      User.find({ villageId: village._id })
        .select('name email phone role avatar bio createdAt villageLocation')
        .sort({ name: 1 }),
      VillageNews.find({ villageId: village._id, isRemoved: false })
        .sort({ createdAt: -1 })
        .populate('userId', 'name avatar')
        .limit(50),
      VillageEvent.find({ villageId: village._id })
        .sort({ date: -1 })
        .populate('createdBy', 'name avatar')
        .limit(50),
    ]);

    res.json({ village, users, posts, events });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getStats,
  listVillages,
  getVillageDetail,
  listUsers,
  banUser,
  unbanUser,
  deleteNewsAdmin,
  postAnnouncement,
  listAnnouncements,
  announcementValidators,
  emergencyAlert,
  emergencyValidators,
};
