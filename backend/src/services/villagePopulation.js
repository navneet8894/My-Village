const User = require('../models/User');
const Family = require('../models/Family');

// Registered people are counted once, even when linked into multiple families.
// Members without a registered account belong to their family owner's village.
async function getVillagePopulation(villageId = null) {
  const familyScope = villageId ? [
    { $lookup: { from: User.collection.name, localField: 'ownerId', foreignField: '_id', as: 'owner' } },
    { $match: { 'owner.villageId': villageId } },
  ] : [];
  const [userCount, familyCounts] = await Promise.all([
    User.countDocuments(villageId ? { villageId } : {}),
    Family.aggregate([
      ...familyScope,
      { $unwind: '$members' },
      { $lookup: { from: User.collection.name, localField: 'members.userId', foreignField: '_id', as: 'registeredAccount' } },
      { $group: {
        _id: null,
        totalMembers: { $sum: 1 },
        additionalFamilyMembers: { $sum: { $cond: [{ $eq: [{ $size: '$registeredAccount' }, 0] }, 1, 0] } },
      } },
    ]),
  ]);
  const { totalMembers = 0, additionalFamilyMembers = 0 } = familyCounts[0] || {};
  return { userCount, totalMembers, additionalFamilyMembers, totalVillagers: userCount + additionalFamilyMembers };
}

module.exports = { getVillagePopulation };
