const User = require('../models/User');

function requireUserVillage(user) {
  if (!user.villageId) {
    const err = new Error('Please add your village first');
    err.status = 403;
    throw err;
  }
  return user.villageId;
}

function villageFilter(user) {
  if (user.role === 'admin') return {};
  if (!user.villageId) return { villageId: null };
  return { villageId: user.villageId };
}

async function getVillageMemberIds(villageId) {
  const users = await User.find({ villageId, isBanned: false }).select('_id');
  return users.map((u) => u._id);
}

module.exports = {
  requireUserVillage,
  villageFilter,
  getVillageMemberIds,
};
