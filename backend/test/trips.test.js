// In-process controller tests: persistence and delivery are isolated doubles.
// Run with `node test/trips.test.js` (no database or notification credentials needed).
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Trip = require('../src/models/Trip');
const Participation = require('../src/models/TripParticipation');
const Village = require('../src/models/Village');
const notifications = require('../src/services/notificationService');
let notificationFailure = false;
let notificationResult;
let deliveries = [];
notifications.notifyAllVillagers = async (...args) => { if (notificationFailure) throw new Error('Delivery unavailable'); deliveries.push(args); return notificationResult; };
notifications.notifyUser = async (...args) => { if (notificationFailure) throw new Error('Delivery unavailable'); deliveries.push(args); return notificationResult; };
const controller = require('../src/controllers/tripController');
const ids = Array.from({ length: 6 }, () => new mongoose.Types.ObjectId());
const [villageA, villageB, organizerId, memberId, outsiderId, adminId] = ids;
const organizer = { _id: organizerId, villageId: villageA, role: 'user' };
const member = { _id: memberId, villageId: villageA, role: 'user' };
const outsider = { _id: outsiderId, villageId: villageB, role: 'user' };
const admin = { _id: adminId, role: 'admin' };
let trips, rows;
const same = (a, b) => String(a?._id || a) === String(b?._id || b);
function matches(row, filter) {
  return Object.entries(filter).every(([key, value]) => value?.$in ? value.$in.some(v => same(row[key], v)) : same(row[key], value));
}
function chain(values) {
  return { sort() { return this; }, populate() { return this; }, lean() { return Promise.resolve(values); }, then(resolve, reject) { return Promise.resolve(values).then(resolve, reject); } };
}
function document(values = {}) {
  const trip = new Trip({ villageId: villageA, organizer: organizerId, title: 'Village picnic', destination: 'Lake', meetingPoint: 'Village square', departureAt: new Date(Date.now() + 86400000), ...values });
  trip.save = async () => trip;
  trip.populate = async () => trip;
  return trip;
}
beforeEach(() => {
  notificationFailure = false; notificationResult = undefined; deliveries = []; rows = []; trips = [document()];
  Trip.findOne = async filter => trips.find(t => matches(t, filter)) || null;
  Trip.find = filter => chain(trips.filter(t => matches(t, filter)));
  Trip.create = async values => { const trip = document(values); trips.push(trip); return trip; };
  Village.exists = async ({ _id }) => same(_id, villageA) || same(_id, villageB);
  Participation.find = filter => chain(rows.filter(row => matches(row, filter)));
  Participation.findOneAndUpdate = async (filter, update) => {
    let row = rows.find(r => matches(r, filter));
    if (!row) { row = { ...filter, _id: new mongoose.Types.ObjectId() }; rows.push(row); }
    Object.assign(row, update.$set); return row;
  };
  Participation.updateOne = async (filter, update) => { const row = rows.find(r => matches(r, filter)); if (row) Object.assign(row, update.$set); };
});
async function call(name, user = member, body = {}, id = trips[0]._id) {
  const result = { status: 200 };
  const res = { status(code) { result.status = code; return this; }, json(value) { result.body = value; return this; } };
  await controller[name]({ user, body, params: { id: String(id) } }, res, error => { result.status = error.status || 500; result.error = error.message; });
  return result;
}
const input = () => ({ title: 'Temple visit', destination: 'Temple', meetingPoint: 'Bus stand', departureAt: new Date(Date.now() + 86400000).toISOString() });

test('creation derives ownership and village from authentication, ignoring injected identity', async () => {
  const result = await call('create', member, { ...input(), villageId: villageB, organizer: outsiderId });
  assert.equal(result.status, 201);
  assert.ok(same(result.body.organizer, memberId));
  assert.ok(same(result.body.villageId, villageA));
  assert.ok(same(deliveries[0][4], villageA));
});
test('admin must select an existing village', async () => {
  assert.equal((await call('create', admin, input())).status, 400);
  assert.equal((await call('create', admin, { ...input(), villageId: new mongoose.Types.ObjectId() })).status, 400);
  assert.equal((await call('create', admin, { ...input(), villageId: villageB })).status, 201);
});
test('unassigned users cannot list or create trips', async () => {
  const unassigned = { _id: memberId, role: 'user' };
  assert.equal((await call('list', unassigned)).status, 403);
  assert.equal((await call('create', unassigned, input())).status, 403);
});
test('cross-village listing and object access are restricted', async () => {
  assert.deepEqual((await call('list', outsider)).body, []);
  for (const action of ['get', 'update', 'participate', 'leave', 'participants']) assert.equal((await call(action, outsider, { additionalFamilyCount: 0 })).status, 404);
  assert.equal((await call('get', member, {}, 'invalid')).status, 404);
});
test('ordinary villagers cannot edit or read the private participant list', async () => {
  assert.equal((await call('update', member, { title: 'Changed' })).status, 403);
  assert.equal((await call('participants', member)).status, 403);
  assert.equal((await call('participants', organizer)).status, 200);
  assert.equal((await call('participants', admin)).status, 200);
});
test('organizer edits cannot reassign ownership or village', async () => {
  const result = await call('update', organizer, { title: 'Updated trip', villageId: villageB, organizer: memberId });
  assert.equal(result.status, 200);
  assert.equal(result.body.title, 'Updated trip');
  assert.ok(same(result.body.organizer, organizerId));
  assert.ok(same(result.body.villageId, villageA));
});
test('self plus two family members totals three, repeated confirmations update one record', async () => {
  await Promise.all(Array.from({ length: 5 }, () => call('participate', member, { additionalFamilyCount: 2 })));
  assert.equal(rows.length, 1);
  let result = await call('get');
  assert.equal(result.body.totalConfirmed, 3);
  assert.deepEqual(result.body.myParticipation, { additionalFamilyCount: 2 });
  await call('participate', member, { additionalFamilyCount: 4 });
  result = await call('get');
  assert.equal(result.body.totalConfirmed, 5);
  assert.equal(rows.length, 1);
});
test('duplicate-key race retries an update without inserting another participation', async () => {
  rows.push({ trip: trips[0]._id, user: memberId, active: true, additionalFamilyCount: 0 });
  Participation.findOneAndUpdate = async () => { throw Object.assign(new Error('Duplicate'), { code: 11000 }); };
  assert.equal((await call('participate', member, { additionalFamilyCount: 2 })).status, 200);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].additionalFamilyCount, 2);
});
test('confirmation cancellation preserves history and excludes party from totals', async () => {
  await call('participate', member, { additionalFamilyCount: 2 });
  await call('leave'); await call('leave');
  assert.equal(rows.length, 1); assert.equal(rows[0].active, false);
  assert.equal((await call('get')).body.totalConfirmed, 0);
  await call('participate', member, { additionalFamilyCount: 0 });
  assert.equal(rows.length, 1); assert.equal((await call('get')).body.totalConfirmed, 1);
});
test('invalid counts are rejected without writing', async () => {
  for (const count of [-1, 1.5, '2', null, undefined, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.equal((await call('participate', member, { additionalFamilyCount: count })).status, 400);
  assert.equal(rows.length, 0);
});
test('past and cancelled trips reject new or changed confirmations', async () => {
  trips[0].departureAt = new Date(Date.now() - 1000);
  assert.equal((await call('participate', member, { additionalFamilyCount: 0 })).status, 409);
  trips[0].departureAt = new Date(Date.now() + 86400000); trips[0].status = 'cancelled';
  assert.equal((await call('participate', member, { additionalFamilyCount: 0 })).status, 409);
  assert.equal((await call('leave')).status, 409);
});
test('trip cancellation retains attendance, notifies participants, and cannot reopen', async () => {
  await call('participate', member, { additionalFamilyCount: 2 });
  const result = await call('update', organizer, { status: 'cancelled' });
  assert.equal(result.status, 200); assert.equal(result.body.status, 'cancelled');
  assert.equal(rows[0].active, true); assert.equal(deliveries.length, 1);
  assert.ok(same(deliveries[0][0], memberId));
  assert.equal((await call('update', organizer, { status: 'active' })).status, 400);
});
test('notification failure returns saved trip and an accurate warning', async () => {
  notificationFailure = true;
  const result = await call('create', member, input());
  assert.equal(result.status, 201); assert.equal(trips.length, 2);
  assert.match(result.body.notificationWarning, /Trip saved/);
});
test('list data exposes only aggregate attendance and own confirmation', async () => {
  await call('participate', member, { additionalFamilyCount: 2 });
  const result = await call('list', organizer);
  assert.equal(result.body[0].totalConfirmed, 3);
  assert.equal(result.body[0].myParticipation, null);
  assert.equal(JSON.stringify(result.body).includes(String(memberId)), false);
  assert.equal((await call('participate', admin, { additionalFamilyCount: 0 })).status, 403);
});
test('partial provider failure warns without failing the saved mutation', async () => {
  notificationResult = { failureCount: 1 };
  const created = await call('create', member, input());
  assert.equal(created.status, 201);
  assert.match(created.body.notificationWarning, /push notifications/);
  await call('participate', member, { additionalFamilyCount: 0 });
  notificationResult = { error: 'provider rejected token' };
  const updated = await call('update', organizer, { title: 'New destination' });
  assert.equal(updated.status, 200);
  assert.match(updated.body.notificationWarning, /In-app notifications are available/);
});
test('details validation rejects missing fields, invalid costs, times and photo URLs', () => {
  for (const body of [{}, { ...input(), title: ' ' }, { ...input(), estimatedCost: -1 }, { ...input(), estimatedCost: '50' }, { ...input(), departureAt: '2027-01-01T10:00' }, { ...input(), departureAt: new Date(0).toISOString() }, { ...input(), returnAt: new Date(0).toISOString() }, { ...input(), coverUrl: 'javascript:alert(1)' }]) assert.throws(() => controller.validateDetails(body), e => e.status === 400);
  const data = controller.validateDetails({ ...input(), estimatedCost: 0, returnAt: null });
  assert.equal(data.estimatedCost, 0); assert.ok(data.departureAt instanceof Date);
});
test('Mongoose participation schema defines unique trip/user index and validates integer counts', () => {
  assert.ok(Participation.schema.indexes().some(([keys, options]) => keys.trip === 1 && keys.user === 1 && options.unique));
  const invalid = new Participation({ trip: trips[0]._id, user: memberId, additionalFamilyCount: 1.5 });
  assert.ok(invalid.validateSync());
});
