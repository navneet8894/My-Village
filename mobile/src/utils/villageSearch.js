const NOMINATIM_HEADERS = { 'User-Agent': 'MY-VILLAGE-Mobile/1.0' };

function mapResult(p) {
  const name = p.name || p.display_name?.split(',')[0] || '';
  if (!name) return null;
  return {
    name,
    lat: parseFloat(p.lat),
    lng: parseFloat(p.lon),
    placeId: String(p.place_id || ''),
    formattedAddress: p.display_name || '',
    source: 'nominatim',
  };
}

async function nominatimFetch(params) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: NOMINATIM_HEADERS,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).map(mapResult).filter(Boolean);
}

export async function fetchVillagesClient({ country, state, district }) {
  const batches = [
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
  const seen = new Set();
  const merged = [];
  for (const list of results) {
    for (const v of list) {
      const key = v.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(v);
      }
    }
  }
  return merged.sort((a, b) => a.name.localeCompare(b.name));
}
