const Village = require('../models/Village');
const OfficialLocation = require('../models/OfficialLocation');
const {
  listCountries,
  listStates,
  listDistricts,
  searchVillages,
} = require('../services/locationService');

const geocodeCache = new Map();

async function searchPlaces(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2 || q.length > 120) return res.status(400).json({ message: 'Enter a location between 2 and 120 characters' });
    const cacheKey = q.toLowerCase();
    if (geocodeCache.has(cacheKey)) return res.json(geocodeCache.get(cacheKey));

    const baseUrl = process.env.PHOTON_URL || 'https://photon.komoot.io';
    const url = new URL('/api', baseUrl);
    url.searchParams.set('q', q);
    url.searchParams.set('limit', '5');
    url.searchParams.set('lang', String(req.query.lang || 'en').slice(0, 2));
    const response = await fetch(url, { headers: { 'User-Agent': 'VillageManagementSystem/1.0', Accept: 'application/json' } });
    if (!response.ok) return res.status(502).json({ message: 'Location search service is unavailable' });
    const payload = await response.json();
    const results = (payload.features || []).map((feature, index) => {
      const p = feature.properties || {};
      const parts = [p.name, p.street, p.locality, p.city, p.district, p.state, p.country].filter((value, i, all) => value && all.indexOf(value) === i);
      return { id: String(p.osm_id || `${cacheKey}-${index}`), name: parts.join(', '), type: p.type || p.osm_value || '', lat: Number(feature.geometry?.coordinates?.[1]), lng: Number(feature.geometry?.coordinates?.[0]) };
    }).filter((row) => row.name && Number.isFinite(row.lat) && Number.isFinite(row.lng));
    if (geocodeCache.size >= 200) geocodeCache.clear();
    geocodeCache.set(cacheKey, results);
    res.json(results);
  } catch (e) { next(e); }
}

async function getCountries(req, res) {
  res.json(listCountries());
}

async function getStates(req, res, next) {
  try {
    const { countryCode } = req.params;
    if (!countryCode) return res.status(400).json({ message: 'countryCode required' });
    if (countryCode === 'IN') {
      const states = await OfficialLocation.find({ type: 'state' }).select('code name -_id').sort({ name: 1 }).lean();
      if (states.length) return res.json(states.map((s) => ({ name: s.name, isoCode: s.code, code: s.code })));
    }
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
    if (countryCode === 'IN') {
      const stateCode = String(req.query.stateCode || '');
      const query = { type: 'district', ...(stateCode ? { stateCode } : { stateName: state }) };
      const districts = await OfficialLocation.find(query).select('code name -_id').sort({ name: 1 }).lean();
      if (districts.length) return res.json(districts);
    }
    res.json(listDistricts(countryCode, state));
  } catch (e) {
    next(e);
  }
}

async function getSubDistricts(req, res, next) {
  try {
    const districtCode = String(req.query.districtCode || '');
    if (!districtCode) return res.status(400).json({ message: 'districtCode required' });
    const rows = await OfficialLocation.find({ type: 'subdistrict', districtCode })
      .select('code name -_id').sort({ name: 1 }).lean();
    res.json(rows);
  } catch (e) { next(e); }
}

async function getVillages(req, res, next) {
  try {
    const { country, state, district, subDistrictCode, districtCode, q } = req.query;
    if (!country || !state || !district) {
      return res.status(400).json({ message: 'country, state, and district required' });
    }

    const dbVillages = await Village.find({ country, state, district })
      .select('name lat lng placeId formattedAddress')
      .sort({ name: 1 })
      .limit(200);

    const officialQuery = { type: 'village' };
    if (subDistrictCode) officialQuery.subDistrictCode = String(subDistrictCode);
    else if (districtCode) officialQuery.districtCode = String(districtCode);
    else officialQuery.districtName = district;
    if (q) officialQuery.name = { $regex: String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const officialVillages = await OfficialLocation.find(officialQuery).select('code name subDistrictCode subDistrictName -_id').sort({ name: 1 }).limit(5000).lean();
    const googleResults = officialVillages.length ? [] : await searchVillages({ country, state, district, q });
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

    for (const v of officialVillages) {
      const key = v.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({ name: v.name, code: v.code, subDistrictCode: v.subDistrictCode, subDistrictName: v.subDistrictName, source: 'official' });
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
  getSubDistricts,
  getVillages,
  searchPlaces,
};
