const { body } = require('express-validator');
const User = require('../models/User');
const Village = require('../models/Village');
const VillageNews = require('../models/VillageNews');
const { resolveVillageCoords } = require('../services/locationService');

const joinVillageValidators = [
  body('country').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('district').trim().notEmpty(),
  body('village').trim().notEmpty(),
  body('countryCode').optional().isString(),
  body('stateCode').optional().isString(),
  body('lat').optional({ values: 'null' }).isFloat(),
  body('lng').optional({ values: 'null' }).isFloat(),
  body('placeId').optional().isString(),
];

async function joinVillage(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (user.villageId) {
      return res.status(400).json({
        message:
          'You are already registered to a village. You cannot register to another village.',
      });
    }

    const {
      country,
      countryCode,
      state,
      stateCode,
      district,
      village,
      lat,
      lng,
      placeId,
      formattedAddress,
    } = req.body;

    let coords = { lat, lng, placeId, formattedAddress };
    if (lat == null || lng == null) {
      const geo = await resolveVillageCoords({ country, state, district, village });
      if (geo) coords = geo;
    }

    const villageDoc = await Village.findOrCreate({
      country,
      countryCode: countryCode || '',
      state,
      stateCode: stateCode || '',
      district,
      name: village,
      lat: coords.lat,
      lng: coords.lng,
      placeId: coords.placeId || placeId || '',
      formattedAddress: coords.formattedAddress || formattedAddress || '',
    });

    user.villageId = villageDoc._id;
    user.villageLocation = {
      country,
      state,
      district,
      village,
      lat: coords.lat,
      lng: coords.lng,
      placeId: coords.placeId || placeId || '',
      label: `${village}, ${district}, ${state}`,
    };
    await user.save();

    res.json({ village: villageDoc, user });
  } catch (e) {
    next(e);
  }
}

async function getMyVillage(req, res, next) {
  try {
    if (!req.user.villageId) {
      return res.json({ village: null, members: [] });
    }
    const village = await Village.findById(req.user.villageId);
    const members = await User.find({ villageId: req.user.villageId, isBanned: false })
      .select('name email avatar bio phone villageLocation createdAt')
      .sort({ name: 1 });
    res.json({ village, members });
  } catch (e) {
    next(e);
  }
}

async function getVillageMembers(req, res, next) {
  try {
    if (!req.user.villageId) {
      return res.status(403).json({ message: 'Please add your village first' });
    }
    const members = await User.find({ villageId: req.user.villageId, isBanned: false })
      .select('name email avatar bio phone villageLocation createdAt')
      .sort({ name: 1 });
    res.json(members);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  joinVillage,
  joinVillageValidators,
  getMyVillage,
  getVillageMembers,
};
