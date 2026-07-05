const VillageNews = require('../models/VillageNews');
const { body } = require('express-validator');
const { notifyAllVillagers } = require('../services/notificationService');
const { requireUserVillage, villageFilter } = require('../services/villageScope');

const newsValidators = [
  body('kind').isIn(['text', 'photo', 'video', 'voice']),
  body('text').optional().isString(),
  body('mediaUrl').optional().isString(),
  body('thumbnailUrl').optional().isString(),
];

async function listNews(req, res, next) {
  try {
    const filter = { isRemoved: false, ...villageFilter(req.user) };
    const list = await VillageNews.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name avatar');
    res.json(list);
  } catch (e) {
    next(e);
  }
}

async function createNews(req, res, next) {
  try {
    const villageId = requireUserVillage(req.user);
    const { kind, text, mediaUrl, thumbnailUrl } = req.body;
    const post = await VillageNews.create({
      userId: req.user._id,
      villageId,
      kind,
      text: text || '',
      mediaUrl: mediaUrl || '',
      thumbnailUrl: thumbnailUrl || '',
    });
    await notifyAllVillagers(
      'Village news',
      kind === 'text' ? text?.slice(0, 80) || 'New post' : 'New media post',
      'news',
      { newsId: String(post._id) },
      villageId
    );
    res.status(201).json(post);
  } catch (e) {
    next(e);
  }
}

async function deleteOwnNews(req, res, next) {
  try {
    const n = await VillageNews.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'Not found' });
    if (String(n.userId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    n.isRemoved = true;
    await n.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listNews,
  createNews,
  deleteOwnNews,
  newsValidators,
};
