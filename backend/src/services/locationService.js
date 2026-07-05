const { Country, State, City } = require('country-state-city');
const indiaDistricts = require('../data/indiaDistricts');

const GOOGLE_KEY = () => process.env.GOOGLE_MAPS_API_KEY || '';
const NOMINATIM_HEADERS = { 'User-Agent': 'MY-VILLAGE-App/1.0 (village lookup)' };

function listCountries() {
  return Country.getAllCountries().map((c) => ({
    name: c.name,
    isoCode: c.isoCode,
    flag: c.flag,
  }));
}

function listStates(countryCode) {
  return State.getStatesOfCountry(countryCode).map((s) => ({
    name: s.name,
    isoCode: s.isoCode,
    countryCode: s.countryCode,
  }));
}

function listDistricts(countryCode, stateName) {
  if (countryCode === 'IN') {
    const districts = indiaDistricts[stateName] || [];
    return districts.map((name) => ({ name }));
  }
  const state = State.getStatesOfCountry(countryCode).find((s) => s.name === stateName);
  if (!state) return [];
  return City.getCitiesOfState(countryCode, state.isoCode).map((c) => ({ name: c.name }));
}

function mapNominatimResult(p) {
  const name = p.name || p.display_name?.split(',')[0] || '';
  if (!name) return null;
  return {
    name,
    lat: parseFloat(p.lat),
    lng: parseFloat(p.lon),
    placeId: String(p.place_id || ''),
    formattedAddress: p.display_name || '',
  };
}

async function nominatimFetch(params) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: NOMINATIM_HEADERS,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map(mapNominatimResult).filter(Boolean);
  } catch {
    return [];
  }
}

async function searchVillagesNominatim({ country, state, district, q }) {
  const batches = q
    ? [
        nominatimFetch(
          new URLSearchParams({
            q: `${q}, ${district}, ${state}, ${country}`,
            format: 'json',
            addressdetails: '1',
            limit: '50',
          })
        ),
      ]
    : [
        nominatimFetch(
          new URLSearchParams({
            q: `village, ${district}, ${state}, ${country}`,
            format: 'json',
            addressdetails: '1',
            limit: '50',
            featuretype: 'settlement',
          })
        ),
        nominatimFetch(
          new URLSearchParams({
            county: district,
            state,
            country,
            format: 'json',
            addressdetails: '1',
            limit: '50',
            featuretype: 'settlement',
          })
        ),
        nominatimFetch(
          new URLSearchParams({
            q: `${district} district villages, ${state}, ${country}`,
            format: 'json',
            addressdetails: '1',
            limit: '50',
          })
        ),
        nominatimFetch(
          new URLSearchParams({
            city: district,
            state,
            country,
            format: 'json',
            addressdetails: '1',
            limit: '50',
          })
        ),
      ];

  const results = await Promise.all(batches);
  return results.flat();
}

async function searchVillagesOverpass({ district, state, country }) {
  try {
    const safeDistrict = district.replace(/"/g, '');
    const safeState = state.replace(/"/g, '');
    const query = `
      [out:json][timeout:90];
      area["name"="${safeDistrict}"]["boundary"="administrative"]->.d;
      area["name"="${safeState}"]["boundary"="administrative"]->.s;
      (
        node["place"~"village|hamlet|town"](area.d);
        node["place"~"village|hamlet|town"](area.s);
        way["place"~"village|hamlet|town"](area.d);
      );
      out center tags;
    `;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.elements || [])
      .map((el) => {
        const name = el.tags?.name;
        if (!name) return null;
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        return {
          name,
          lat: lat != null ? parseFloat(lat) : undefined,
          lng: lng != null ? parseFloat(lng) : undefined,
          placeId: `osm-${el.type}-${el.id}`,
          formattedAddress: `${name}, ${district}, ${state}, ${country}`,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function googleGeocode(address) {
  const key = GOOGLE_KEY();
  if (!key) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.length) return null;
  const r = data.results[0];
  return {
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    placeId: r.place_id,
    formattedAddress: r.formatted_address,
  };
}

async function nominatimGeocode(address) {
  const list = await nominatimFetch(
    new URLSearchParams({ q: address, format: 'json', limit: '1', addressdetails: '1' })
  );
  if (!list.length) return null;
  const r = list[0];
  return {
    lat: r.lat,
    lng: r.lng,
    placeId: r.placeId || '',
    formattedAddress: r.formattedAddress || address,
  };
}

async function googlePlaceSearch(query) {
  const key = GOOGLE_KEY();
  if (!key || !query) return [];
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];
  return (data.results || []).map((p) => ({
    name: p.name,
    placeId: p.place_id,
    lat: p.geometry?.location?.lat,
    lng: p.geometry?.location?.lng,
    formattedAddress: p.formatted_address,
  }));
}

async function searchVillages({ country, state, district, q }) {
  const googleQueries = q
    ? [`${q}, ${district}, ${state}, ${country}`]
    : [
        `villages in ${district}, ${state}, ${country}`,
        `village, ${district}, ${state}, ${country}`,
      ];

  const [nominatim, overpass, ...googleBatches] = await Promise.all([
    searchVillagesNominatim({ country, state, district, q }),
    q ? Promise.resolve([]) : searchVillagesOverpass({ district, state, country }),
    ...googleQueries.map((query) => googlePlaceSearch(query)),
  ]);

  const seen = new Set();
  const merged = [];
  for (const list of [nominatim, overpass, ...googleBatches]) {
    for (const p of list) {
      const key = p.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(p);
      }
    }
  }
  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

async function resolveVillageCoords({ country, state, district, village }) {
  const address = `${village}, ${district}, ${state}, ${country}`;
  const google = await googleGeocode(address);
  if (google) return google;
  return nominatimGeocode(address);
}

module.exports = {
  listCountries,
  listStates,
  listDistricts,
  searchVillages,
  resolveVillageCoords,
  googleGeocode,
  nominatimGeocode,
};
