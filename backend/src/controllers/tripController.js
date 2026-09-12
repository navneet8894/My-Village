const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Participation = require('../models/TripParticipation');
const Village = require('../models/Village');
const { notifyAllVillagers, notifyUser } = require('../services/notificationService');

function fail(status, message) { throw Object.assign(new Error(message), { status }); }
function scope(user) {
  if (user.role === 'admin') return {};
  if (!user.villageId) fail(403, 'Please join a village first');
  return { villageId: user.villageId };
}
function canManage(user, trip) { return user.role === 'admin' || String(trip.organizer?._id || trip.organizer) === String(user._id); }
function validateDetails(body, existing = {}) {
  const result = {};
  for (const key of ['title', 'destination', 'meetingPoint', 'description', 'coverUrl']) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== 'string' || body[key].length > (key === 'description' ? 5000 : 2000)) fail(400, `Invalid ${key}`);
      result[key] = body[key].trim();
    }
  }
  for (const key of ['title', 'destination', 'meetingPoint']) if (!(result[key] ?? existing[key])) fail(400, `${key} is required`);
  if (result.coverUrl && !/^https:\/\//i.test(result.coverUrl)) fail(400, 'Cover photo must use an HTTPS URL');
  for (const key of ['departureAt', 'returnAt']) {
    if (body[key] !== undefined) {
      if (key === 'returnAt' && (body[key] === null || body[key] === '')) result[key] = null;
      else {
        if (typeof body[key] !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(body[key]) || !Number.isFinite(Date.parse(body[key]))) fail(400, `Invalid ${key}`);
        result[key] = new Date(body[key]);
      }
    }
  }
  const departure = result.departureAt ?? existing.departureAt;
  if (!departure) fail(400, 'Departure time is required');
  if ((!existing.departureAt || result.departureAt) && new Date(departure) <= new Date()) fail(400, 'Departure must be in the future');
  const returning = result.returnAt === undefined ? existing.returnAt : result.returnAt;
  if (returning && new Date(returning) < new Date(departure)) fail(400, 'Return must be after departure');
  if (body.estimatedCost !== undefined) {
    if (body.estimatedCost !== null && (typeof body.estimatedCost !== 'number' || !Number.isFinite(body.estimatedCost) || body.estimatedCost < 0)) fail(400, 'Invalid estimated cost');
    result.estimatedCost = body.estimatedCost;
  }
  if (body.status !== undefined) {
    if (!['active', 'cancelled'].includes(body.status)) fail(400, 'Invalid trip status');
    if (existing.status === 'cancelled' && body.status !== 'cancelled') fail(400, 'Cancelled trips cannot reopen');
    result.status = body.status;
  }
  return result;
}
async function findTrip(req) {
  if (!mongoose.isValidObjectId(req.params.id)) fail(404, 'Trip not found');
  const trip = await Trip.findOne({ _id: req.params.id, ...scope(req.user) });
  if (!trip) fail(404, 'Trip not found');
  return trip;
}
async function present(trips, user) {
  const rows = await Participation.find({ trip: { $in: trips.map(t => t._id) }, active: true }).lean();
  return trips.map(trip => {
    const attendees = rows.filter(r => String(r.trip) === String(trip._id));
    const mine = attendees.find(r => String(r.user) === String(user._id));
    return { ...trip.toObject(), totalConfirmed: attendees.reduce((sum, r) => sum + 1 + r.additionalFamilyCount, 0), myParticipation: mine ? { additionalFamilyCount: mine.additionalFamilyCount } : null, canManage: canManage(user, trip), canParticipate: String(user.villageId) === String(trip.villageId?._id || trip.villageId) };
  });
}
async function notifySafely(trip, created) {
  try {
    const title = created ? 'New village trip' : trip.status === 'cancelled' ? 'Trip cancelled' : 'Trip updated';
    const data = { tripId: String(trip._id), url: `/dashboard/trips/${trip._id}` };
    let results;
    if (created) results = [await notifyAllVillagers(title, trip.title, 'trip', data, trip.villageId)];
    else {
      const rows = await Participation.find({ trip: trip._id, active: true });
      results = await Promise.all(rows.map(row => notifyUser(row.user, title, trip.title, 'trip', data)));
    }
    if (results.some(result => result?.error || result?.failureCount > 0)) return 'Trip saved, but some push notifications could not be delivered. In-app notifications are available.';
    return null;
  } catch (error) {
    console.error('Trip notification failed:', error.message);
    return 'Trip saved, but some notifications could not be delivered.';
  }
}
const handle = fn => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
const list = handle(async (req, res) => {
  const trips = await Trip.find(scope(req.user)).sort({ departureAt: 1 }).populate('organizer', 'name').populate('villageId', 'name');
  res.json(await present(trips, req.user));
});
const get = handle(async (req, res) => {
  const trip = await findTrip(req);
  await trip.populate([{ path: 'organizer', select: 'name' }, { path: 'villageId', select: 'name' }]);
  res.json((await present([trip], req.user))[0]);
});
const create = handle(async (req, res) => {
  const villageId = req.user.role === 'admin' ? req.body.villageId : scope(req.user).villageId;
  if (!mongoose.isValidObjectId(villageId) || !await Village.exists({ _id: villageId })) fail(400, 'Select a valid village');
  const trip = await Trip.create({ ...validateDetails(req.body), status: 'active', villageId, organizer: req.user._id });
  const notificationWarning = await notifySafely(trip, true);
  res.status(201).json({ ...trip.toObject(), notificationWarning });
});
const update = handle(async (req, res) => {
  const trip = await findTrip(req);
  if (!canManage(req.user, trip)) fail(403, 'Only the organizer or admin can edit this trip');
  Object.assign(trip, validateDetails(req.body, trip));
  await trip.save();
  const notificationWarning = await notifySafely(trip, false);
  res.json({ ...trip.toObject(), notificationWarning });
});
const participate = handle(async (req, res) => {
  const trip = await findTrip(req);
  if (String(req.user.villageId) !== String(trip.villageId)) fail(403, 'Only members of this village can join');
  if (trip.status !== 'active' || trip.departureAt <= new Date()) fail(409, 'Confirmations are closed');
  const count = req.body.additionalFamilyCount;
  if (!Number.isSafeInteger(count) || count < 0) fail(400, 'Family count must be a nonnegative whole number');
  const filter = { trip: trip._id, user: req.user._id };
  const change = { $set: { additionalFamilyCount: count, active: true } };
  try { await Participation.findOneAndUpdate(filter, change, { upsert: true, runValidators: true }); }
  catch (e) { if (e.code !== 11000) throw e; await Participation.updateOne(filter, change, { runValidators: true }); }
  res.json({ ok: true });
});
const leave = handle(async (req, res) => {
  const trip = await findTrip(req);
  if (trip.status !== 'active' || trip.departureAt <= new Date()) fail(409, 'Confirmations are closed');
  await Participation.updateOne({ trip: trip._id, user: req.user._id }, { $set: { active: false } });
  res.json({ ok: true });
});
const participants = handle(async (req, res) => {
  const trip = await findTrip(req);
  if (!canManage(req.user, trip)) fail(403, 'Participant list is private to the organizer and admin');
  const rows = await Participation.find({ trip: trip._id, active: true }).populate('user', 'name').lean();
  res.json(rows.map(r => ({ _id: r._id, name: r.user?.name || 'Former member', partyCount: 1 + r.additionalFamilyCount })));
});
module.exports = { list, get, create, update, participate, leave, participants, validateDetails, scope, canManage };
