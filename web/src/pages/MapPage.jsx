import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetEventsQuery, useGetMapConfigQuery, useGetMyVillageQuery, useLazySearchPlacesQuery } from '../app/apiSlice';
import VillageMap from '../components/VillageMap';

export default function MapPage() {
  const user = useSelector((s) => s.auth.user);
  const { data: cfg } = useGetMapConfigQuery();
  const { data: villageData } = useGetMyVillageQuery();
  const { data: events = [] } = useGetEventsQuery();
  const [searchPlaces, { isFetching }] = useLazySearchPlacesQuery();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const village = villageData?.village;
  const center = useMemo(() => {
    const lat = Number(village?.lat ?? user?.villageLocation?.lat);
    const lng = Number(village?.lng ?? user?.villageLocation?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return { lat: Number(cfg?.defaultCenter?.lat ?? 20.5937), lng: Number(cfg?.defaultCenter?.lng ?? 78.9629) };
  }, [village, user, cfg]);
  const hasExactLocation = Number.isFinite(Number(village?.lat ?? user?.villageLocation?.lat)) && Number.isFinite(Number(village?.lng ?? user?.villageLocation?.lng));
  const [viewCenter, setViewCenter] = useState(center);
  const [mapTitle, setMapTitle] = useState('');
  useEffect(() => { setViewCenter(center); setMapTitle(village?.name || user?.villageLocation?.village || 'Village'); }, [center, village?.name, user?.villageLocation?.village]);
  useEffect(() => {
    const value = query.trim();
    if (value.length < 3 || value === mapTitle) { if (value.length < 3) setResults([]); return undefined; }
    setSearchError('');
    const timer = setTimeout(async () => {
      try { const found = await searchPlaces(value).unwrap(); setResults(found); setSearchError(found.length ? '' : 'No matching location found'); } catch (err) { setResults([]); setSearchError(err?.data?.message || 'Location search failed'); }
    }, 450);
    return () => clearTimeout(timer);
  }, [query, mapTitle, searchPlaces]);
  async function handleSearch(e) {
    e.preventDefault();
    const value = query.trim();
    if (value.length < 2) { setSearchError('Enter at least 2 characters'); return; }
    setSearchError('');
    try { const found = await searchPlaces(value).unwrap(); setResults(found); if (!found.length) setSearchError('No matching location found'); } catch (err) { setResults([]); setSearchError(err?.data?.message || 'Location search failed'); }
  }
  function choosePlace(place) { setViewCenter({ lat: place.lat, lng: place.lng }); setMapTitle(place.name); setQuery(place.name); setResults([]); }
  return <div>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#dc704f]">Explore</p><h1 className="village-display mt-1 text-4xl">Village Map</h1><p className="mt-2 text-sm text-text-subtle">{village ? `${village.name}, ${village.district}, ${village.state}` : user?.villageLocation?.label || 'Your village and nearby events'}</p></div><span className="rounded-full bg-[#eaf1ec] px-3 py-1.5 text-xs font-bold text-[#42634f]">{events.length} event pins</span></div>
    {!hasExactLocation && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Exact village coordinates are not set yet. The default India view is shown; an admin can set the precise location.</div>}
    <div className="village-panel relative mt-5 p-2">
      <div className="relative z-20 p-2 sm:p-3"><form className="flex gap-2" onSubmit={handleSearch}><div className="relative flex-1"><svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={query} onChange={(e) => setQuery(e.target.value)} className="theme-input h-11 pl-10" placeholder="Search village, city, landmark or address…" aria-label="Search location" /></div><button disabled={isFetching} className="rounded-xl bg-[#df6744] px-4 text-sm font-bold text-white hover:bg-[#c95738] disabled:opacity-60 sm:px-6">{isFetching ? 'Searching…' : 'Search'}</button></form>
        {(results.length > 0 || searchError) && <div className="absolute left-4 right-4 top-[66px] overflow-hidden rounded-xl border border-line bg-card shadow-xl sm:left-5 sm:right-5 sm:top-[70px]">{searchError && <p className="p-3 text-sm text-danger">{searchError}</p>}{results.map((place) => <button type="button" onClick={() => choosePlace(place)} className="block w-full border-b border-line px-4 py-3 text-left last:border-0 hover:bg-soft" key={place.id}><b className="block truncate text-sm">{place.name.split(',')[0]}</b><span className="mt-0.5 block truncate text-xs text-text-subtle">{place.name}</span></button>)}</div>}
      </div>
      <div className="overflow-hidden rounded-[18px]"><VillageMap center={viewCenter} villageName={mapTitle} events={events} height={520} zoom={16} /></div>
    </div>
    <p className="mt-3 text-xs text-text-subtle">Map data © OpenStreetMap contributors · Tiles by OpenFreeMap</p>
  </div>;
}
