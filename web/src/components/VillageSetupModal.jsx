import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import {
  useGetLocationVillagesQuery,
  useGetMapConfigQuery,
  useJoinVillageMutation,
} from '../app/apiSlice';
import { setUser } from '../features/auth/authSlice';
import { fetchVillagesClient } from '../utils/villageSearch';
import Toast, { getApiErrorMessage } from '../utils/toast';
import Spinner from './Spinner';

const mapStyle = { width: '100%', height: '200px', borderRadius: '8px' };

function buildJoinBody({ countryName, countryCode, stateName, stateCode, district, village }) {
  const body = {
    country: countryName,
    countryCode,
    state: stateName,
    stateCode,
    district,
    village: village.name,
  };
  if (village.lat != null && village.lng != null) {
    body.lat = village.lat;
    body.lng = village.lng;
  }
  if (village.placeId) body.placeId = village.placeId;
  if (village.formattedAddress) body.formattedAddress = village.formattedAddress;
  return body;
}

export default function VillageSetupModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { data: cfg } = useGetMapConfigQuery();
  const [joinVillage, { isLoading: saving }] = useJoinVillageMutation();

  const [locationApi, setLocationApi] = useState(null);
  const [allVillages, setAllVillages] = useState([]);
  const [villagesLoading, setVillagesLoading] = useState(false);

  useEffect(() => {
    if (!open || locationApi) return;
    import('../utils/locationData').then(setLocationApi);
  }, [open, locationApi]);

  const countries = useMemo(
    () => (locationApi ? locationApi.getCountries() : []),
    [locationApi]
  );

  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [villageSearch, setVillageSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState(null);

  const states = useMemo(
    () => (locationApi ? locationApi.getStates(countryCode) : []),
    [locationApi, countryCode]
  );
  const districts = useMemo(
    () => (locationApi ? locationApi.getDistricts(countryCode, stateName) : []),
    [locationApi, countryCode, stateName]
  );

  const { data: apiVillages, isFetching: apiLoading } = useGetLocationVillagesQuery(
    { country: countryName, state: stateName, district },
    { skip: !open || !countryName || !stateName || !district }
  );

  // Merge API + client village lists when district is selected (fetch ALL, no search filter)
  useEffect(() => {
    if (!open || !countryName || !stateName || !district) {
      setAllVillages([]);
      return;
    }

    let cancelled = false;
    async function loadAll() {
      setVillagesLoading(true);
      try {
        let clientList = [];
        try {
          clientList = await fetchVillagesClient({
            country: countryName,
            state: stateName,
            district,
          });
        } catch {
          clientList = [];
        }

        const seen = new Set();
        const merged = [];
        for (const list of [apiVillages || [], clientList]) {
          for (const v of list) {
            const key = v.name.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(v);
            }
          }
        }
        if (!cancelled) {
          setAllVillages(merged.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } finally {
        if (!cancelled) setVillagesLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [open, countryName, stateName, district, apiVillages]);

  const villages = useMemo(() => {
    const q = villageSearch.trim().toLowerCase();
    if (!q) return allVillages;
    return allVillages.filter((v) => v.name.toLowerCase().includes(q));
  }, [allVillages, villageSearch]);

  const canAddCustom =
    villageSearch.trim().length >= 2 &&
    !allVillages.some((v) => v.name.toLowerCase() === villageSearch.trim().toLowerCase());

  const loading = villagesLoading || apiLoading;

  useEffect(() => {
    if (!open) return;
    setCountryCode('');
    setCountryName('');
    setStateCode('');
    setStateName('');
    setDistrict('');
    setVillageSearch('');
    setSelectedVillage(null);
    setAllVillages([]);
  }, [open]);

  const mapCenter = useMemo(() => {
    if (selectedVillage?.lat && selectedVillage?.lng) {
      return { lat: selectedVillage.lat, lng: selectedVillage.lng };
    }
    return {
      lat: cfg?.defaultCenter?.lat ?? 20.5937,
      lng: cfg?.defaultCenter?.lng ?? 78.9629,
    };
  }, [selectedVillage, cfg]);

  function addCustomVillage() {
    const name = villageSearch.trim();
    if (name.length < 2) {
      Toast.error('Enter at least 2 characters for your village name');
      return;
    }
    setSelectedVillage({
      name,
      lat: null,
      lng: null,
      placeId: '',
      formattedAddress: `${name}, ${district}, ${stateName}, ${countryName}`,
      source: 'custom',
    });
    Toast.success(`"${name}" selected — click Save village`);
  }

  if (!open) return null;

  if (user?.villageId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
          <h2 className="text-lg font-bold">Village already set</h2>
          <p className="text-sm text-slate-500 mt-2">
            You are registered to{' '}
            <strong>{user.villageLocation?.village || 'your village'}</strong>. A user can only
            register to one village.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-lg bg-brand-600 text-white py-2.5 font-medium"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  function requireCountry() {
    if (!countryCode) {
      Toast.error('Please select the country first');
      return false;
    }
    return true;
  }

  function requireState() {
    if (!requireCountry()) return false;
    if (!stateName) {
      Toast.error('Please select the state first');
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!requireCountry() || !requireState() || !district) {
      if (district === '') Toast.error('Please select the district');
      return;
    }
    if (!selectedVillage) {
      Toast.error('Please select a village or add your village name');
      return;
    }
    try {
      const res = await joinVillage(
        buildJoinBody({
          countryName,
          countryCode,
          stateName,
          stateCode,
          district,
          village: selectedVillage,
        })
      ).unwrap();
      dispatch(setUser(res.user));
      Toast.success('Village saved!');
      onSuccess?.(res);
      onClose();
    } catch (err) {
      Toast.error(getApiErrorMessage(err, 'Could not save village'));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold">Add your village</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
              value={countryCode}
              onChange={(e) => {
                const c = countries.find((x) => x.isoCode === e.target.value);
                setCountryCode(e.target.value);
                setCountryName(c?.name || '');
                setStateCode('');
                setStateName('');
                setDistrict('');
                setSelectedVillage(null);
              }}
              required
            >
              <option value="">
                {locationApi ? `Select country (${countries.length} available)` : 'Loading countries…'}
              </option>
              {countries.map((c) => (
                <option key={c.isoCode} value={c.isoCode}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">State / Union Territory</label>
            <select
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60"
              value={stateName}
              disabled={!countryCode}
              onMouseDown={(e) => {
                if (!countryCode) {
                  e.preventDefault();
                  Toast.error('Please select the country first');
                }
              }}
              onChange={(e) => {
                if (!requireCountry()) return;
                const s = states.find((x) => x.name === e.target.value);
                setStateName(e.target.value);
                setStateCode(s?.isoCode || '');
                setDistrict('');
                setSelectedVillage(null);
              }}
              required
            >
              <option value="">
                {countryCode ? `Select state (${states.length} available)` : 'Select country first'}
              </option>
              {states.map((s) => (
                <option key={`${s.isoCode}-${s.name}`} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">District</label>
            <select
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60"
              value={district}
              disabled={!stateName}
              onMouseDown={(e) => {
                if (!countryCode) {
                  e.preventDefault();
                  Toast.error('Please select the country first');
                } else if (!stateName) {
                  e.preventDefault();
                  Toast.error('Please select the state first');
                }
              }}
              onChange={(e) => {
                if (!requireState()) return;
                setDistrict(e.target.value);
                setSelectedVillage(null);
                setVillageSearch('');
              }}
              required
            >
              <option value="">
                {stateName ? `Select district (${districts.length} available)` : 'Select state first'}
              </option>
              {districts.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Village</label>
            {!district ? (
              <p className="text-sm text-slate-500 py-2">Select a district to load village names</p>
            ) : (
              <>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 mb-2"
                  placeholder="Search your village name…"
                  value={villageSearch}
                  onChange={(e) => {
                    setVillageSearch(e.target.value);
                    setSelectedVillage(null);
                  }}
                />

                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-4 justify-center">
                    <Spinner className="h-4 w-4" />
                    Loading villages for {district}…
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 mb-2">
                      {villageSearch
                        ? `${villages.length} match${villages.length !== 1 ? 'es' : ''} of ${allVillages.length} villages`
                        : `${allVillages.length} village${allVillages.length !== 1 ? 's' : ''} in ${district}`}
                    </p>
                    <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y dark:divide-slate-800">
                      {villages.length === 0 && !canAddCustom && (
                        <p className="text-sm text-slate-500 p-4 text-center">
                          No villages loaded. Type your village name below to add it.
                        </p>
                      )}
                      {villages.map((v) => (
                        <button
                          key={`${v.name}-${v.source || 'x'}`}
                          type="button"
                          onClick={() => setSelectedVillage(v)}
                          className={`w-full text-left px-3 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition ${
                            selectedVillage?.name === v.name
                              ? 'bg-brand-100 dark:bg-brand-900/40 font-medium text-brand-800 dark:text-brand-200'
                              : ''
                          }`}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>

                    {canAddCustom && (
                      <button
                        type="button"
                        onClick={addCustomVillage}
                        className="mt-3 w-full rounded-lg border-2 border-dashed border-brand-400 text-brand-700 dark:text-brand-300 py-2.5 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20"
                      >
                        + Add &quot;{villageSearch.trim()}&quot; as my village
                      </button>
                    )}

                    {selectedVillage && (
                      <p className="mt-2 text-sm text-brand-700 dark:text-brand-300 font-medium">
                        Selected: {selectedVillage.name}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {cfg?.googleMapsApiKey && selectedVillage?.lat && selectedVillage?.lng && (
            <div>
              <label className="block text-sm font-medium mb-1">Location preview</label>
              <LoadScript googleMapsApiKey={cfg.googleMapsApiKey}>
                <GoogleMap mapContainerStyle={mapStyle} center={mapCenter} zoom={14}>
                  <Marker position={mapCenter} title={selectedVillage.name} />
                </GoogleMap>
              </LoadScript>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 py-2.5 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedVillage || !district}
              className="flex-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white py-2.5 font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Spinner className="h-4 w-4" /> : null}
              Save village
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
