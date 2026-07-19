const VillageEvent = require('../models/VillageEvent');
const { body } = require('express-validator');
const { notifyAllVillagers } = require('../services/notificationService');
const { requireUserVillage, villageFilter } = require('../services/villageScope');

const eventValidators = [
  body('title').trim().notEmpty(),
  body('description').optional().isString(),
  body('date').isISO8601(),
  body('place').optional().isString(),
  body('timing').optional().isString(),
  body('location').optional().isObject(),
  body('eventType').optional().isIn(['village', 'personal']),
];

async function listEvents(req, res, next) {
  try {
    const events = await VillageEvent.find(villageFilter(req.user))
      .sort({ date: 1 })
      .populate('createdBy', 'name avatar');
    res.json(events);
  } catch (e) {
    next(e);
  }
}

async function getEvent(req, res, next) {
  try {
    const ev = await VillageEvent.findOne({
      _id: req.params.id,
      ...villageFilter(req.user),
    }).populate(
      'createdBy',
      'name avatar'
    );
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    res.json(ev);
  } catch (e) {
    next(e);
  }
}

async function createEvent(req, res, next) {
  try {
    const villageId = requireUserVillage(req.user);
    const { title, description, date, place, timing, location, bannerUrl, eventType } =
      req.body;
    const resolvedType = req.user.role === 'admin' ? eventType || 'village' : 'personal';
    const ev = await VillageEvent.create({
      title,
      description,
      date,
      place,
      timing,
      bannerUrl: bannerUrl || '',
      location: location || {},
      createdBy: req.user._id,
      villageId,
      eventType: resolvedType,
    });
    await notifyAllVillagers(
      resolvedType === 'personal' ? 'Villager function invitation' : 'New village event',
      title,
      'event',
      { eventId: String(ev._id) },
      villageId
    );
    res.status(201).json(ev);
  } catch (e) {
    next(e);
  }
}

async function updateEvent(req, res, next) {
  try {
    const ev = await VillageEvent.findOne({
      _id: req.params.id,
      ...villageFilter(req.user),
    });
    if (!ev) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && String(ev.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own function' });
    }
    if (req.user.role !== 'admin') req.body.eventType = 'personal';
    if (req.body.date) ev.reminderSent = false;
    Object.assign(ev, req.body);
    await ev.save();
    res.json(ev);
  } catch (e) {
    next(e);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const ev = await VillageEvent.findOne({
      _id: req.params.id,
      ...villageFilter(req.user),
    });
    if (!ev) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && String(ev.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own function' });
    }
    await ev.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  eventValidators,
};
