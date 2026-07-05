const Village = require('../models/Village');
const {
  listCountries,
  listStates,
  listDistricts,
  searchVillages,
} = require('../services/locationService');

async function getCountries(req, res) {
  res.json(listCountries());
}

async function getStates(req, res, next) {
  try {
    const { countryCode } = req.params;
    if (!countryCode) return res.status(400).json({ message: 'countryCode required' });
    res.json(listStates(countryCode));
  } catch (e) {
    next(e);
  }
}

async function getDistricts(req, res, next) {
  try {
    const { countryCode, state } = req.query;
    if (!countryCode || !state) {
      return res.status(400).json({ message: 'countryCode and state required' });
    }
    res.json(listDistricts(countryCode, state));
  } catch (e) {
    next(e);
  }
}

async function getVillages(req, res, next) {
  try {
    const { country, state, district, q } = req.query;
    if (!country || !state || !district) {
      return res.status(400).json({ message: 'country, state, and district required' });
    }

    const dbVillages = await Village.find({ country, state, district })
      .select('name lat lng placeId formattedAddress')
      .sort({ name: 1 })
      .limit(200);

    const googleResults = await searchVillages({ country, state, district, q });
    const seen = new Set();
    const merged = [];

    for (const v of dbVillages) {
      const key = v.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({
          name: v.name,
          lat: v.lat,
          lng: v.lng,
          placeId: v.placeId,
          formattedAddress: v.formattedAddress,
          source: 'database',
        });
      }
    }

    for (const g of googleResults) {
      const key = g.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({ ...g, source: 'google' });
      }
    }

    let results = merged;
    if (q) {
      const ql = q.toLowerCase();
      results = merged.filter((v) => v.name.toLowerCase().includes(ql));
      if (!results.length && q.trim().length >= 2) {
        results = [
          {
            name: q.trim(),
            lat: null,
            lng: null,
            placeId: '',
            formattedAddress: `${q.trim()}, ${district}, ${state}`,
            source: 'custom',
          },
        ];
      }
    }
    res.json(results);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getCountries,
  getStates,
  getDistricts,
  getVillages,
};
