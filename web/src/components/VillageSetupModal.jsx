import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import VillageMap from './VillageMap';
import {
  useGetLocationVillagesQuery,
  useGetMapConfigQuery,
  useGetStatesQuery,
  useGetDistrictsQuery,
  useGetSubDistrictsQuery,
  useJoinVillageMutation,
  useCreateCustomVillageMutation,
} from '../app/apiSlice';
import { setUser } from '../features/auth/authSlice';
import { fetchVillagesClient } from '../utils/villageSearch';
import Toast, { getApiErrorMessage } from '../utils/toast';
import Spinner from './Spinner';

function buildJoinBody({ countryName, countryCode, stateName, stateCode, district, districtCode, subDistrict, subDistrictCode, village }) {
  const body = {
    country: countryName,
    countryCode,
    state: stateName,
    stateCode,
    district,
    districtCode,
    subDistrict,
    subDistrictCode,
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
  const [createCustomVillage, { isLoading: addingVillage }] = useCreateCustomVillageMutation();

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
  const [districtCode, setDistrictCode] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [subDistrictCode, setSubDistrictCode] = useState('');
  const [villageSearch, setVillageSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [showAddVillage, setShowAddVillage] = useState(false);
  const [newVillageName, setNewVillageName] = useState('');

  const localStates = useMemo(
    () => (locationApi ? locationApi.getStates(countryCode) : []),
    [locationApi, countryCode]
  );
  const localDistricts = useMemo(
    () => (locationApi ? locationApi.getDistricts(countryCode, stateName) : []),
    [locationApi, countryCode, stateName]
  );
  const { data: officialStates } = useGetStatesQuery(countryCode, { skip: !open || !countryCode });
  const { data: officialDistricts } = useGetDistrictsQuery(
    { countryCode, state: stateName, stateCode },
    { skip: !open || !countryCode || !stateName }
  );
  const { data: subDistricts = [], isFetching: subDistrictsLoading } = useGetSubDistrictsQuery(
    districtCode,
    { skip: !open || countryCode !== 'IN' || !districtCode }
  );
  const states = officialStates?.length ? officialStates : localStates;
  const districts = officialDistricts?.length ? officialDistricts : localDistricts;

  const { data: apiVillages, isFetching: apiLoading } = useGetLocationVillagesQuery(
    { country: countryName, state: stateName, district, districtCode, subDistrictCode },
    { skip: !open || !countryName || !stateName || !district || (countryCode === 'IN' && !subDistrictCode) }
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
  }, [open, countryName, stateName, district, districtCode, subDistrictCode, apiVillages]);

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
    setDistrictCode('');
    setSubDistrict('');
    setSubDistrictCode('');
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

  async function saveCustomVillage(e) {
    e.preventDefault();
    const name = newVillageName.trim();
    if (name.length < 2) return Toast.error('Village name kam se kam 2 characters ka hona chahiye');
    try {
      const village = await createCustomVillage({
        country: countryName, countryCode, state: stateName, stateCode,
        district, districtCode, subDistrict, subDistrictCode, village: name,
      }).unwrap();
      setAllVillages((current) => [...current.filter((v) => v.name.toLowerCase() !== name.toLowerCase()), village].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedVillage(village);
      setVillageSearch(name);
      setShowAddVillage(false);
      setNewVillageName('');
      Toast.success('Village database me add ho gaya');
    } catch (err) {
      Toast.error(getApiErrorMessage(err, 'Village add nahi ho saka'));
    }
  }

  if (!open) return null;

  if (user?.villageId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-line p-6 text-center">
          <h2 className="text-lg font-bold">Village already set</h2>
          <p className="text-sm text-text-subtle mt-2">
            You are registered to{' '}
            <strong>{user.villageLocation?.village || 'your village'}</strong>. A user can only
            register to one village.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-lg bg-primary text-primary-contrast py-2.5 font-medium"
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
          districtCode,
          subDistrict,
          subDistrictCode,
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
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-2xl border border-line">
        <div className="sticky top-0 bg-card border-b border-line px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold">Add your village</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-subtle hover:text-text text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              className="theme-input"
              value={countryCode}
              onChange={(e) => {
                const c = countries.find((x) => x.isoCode === e.target.value);
                setCountryCode(e.target.value);
                setCountryName(c?.name || '');
                setStateCode('');
                setStateName('');
                setDistrict('');
                setDistrictCode('');
                setSubDistrict('');
                setSubDistrictCode('');
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
              className="theme-input"
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
                setStateCode(s?.code || s?.isoCode || '');
                setDistrict('');
                setDistrictCode('');
                setSubDistrict('');
                setSubDistrictCode('');
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
              className="theme-input"
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
                const d = districts.find((item) => item.name === e.target.value);
                setDistrict(e.target.value);
                setDistrictCode(String(d?.code || ''));
                setSubDistrict('');
                setSubDistrictCode('');
                setSelectedVillage(null);
                setVillageSearch('');
              }}
              required
            >
              <option value="">
                {stateName ? `Select district (${districts.length} available)` : 'Select state first'}
              </option>
              {districts.map((d) => (
                <option key={`${d.code || ''}-${d.name}`} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {countryCode === 'IN' && (
            <div>
              <label className="block text-sm font-medium mb-1">Sub-district / Tehsil</label>
              <select
                className="theme-input"
                value={subDistrictCode}
                disabled={!districtCode || subDistrictsLoading}
                onChange={(e) => {
                  const item = subDistricts.find((row) => String(row.code) === e.target.value);
                  setSubDistrictCode(e.target.value);
                  setSubDistrict(item?.name || '');
                  setSelectedVillage(null);
                  setVillageSearch('');
                }}
                required
              >
                <option value="">{subDistrictsLoading ? 'Loading tehsils…' : districtCode ? `Select tehsil (${subDistricts.length} available)` : 'Select district first'}</option>
                {subDistricts.map((item) => <option key={item.code} value={String(item.code)}>{item.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Village</label>
            {!district || (countryCode === 'IN' && !subDistrictCode) ? (
              <p className="text-sm text-text-subtle py-2">{!district ? 'Select a district to load village names' : 'Select a tehsil to load village names'}</p>
            ) : (
              <>
                <input
                  type="text"
                  className="theme-input mb-2"
                  placeholder="Search your village name…"
                  value={villageSearch}
                  onChange={(e) => {
                    setVillageSearch(e.target.value);
                    setSelectedVillage(null);
                  }}
                />

                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-text-subtle py-4 justify-center">
                    <Spinner className="h-4 w-4" />
                    Loading villages for {district}…
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-text-subtle mb-2">
                      {villageSearch
                        ? `${villages.length} match${villages.length !== 1 ? 'es' : ''} of ${allVillages.length} villages`
                        : `${allVillages.length} village${allVillages.length !== 1 ? 's' : ''} in ${district}`}
                    </p>
                    <div className="max-h-52 overflow-y-auto rounded-lg border border-line divide-y divide-line">
                      {villages.length === 0 && (
                        <p className="text-sm text-text-subtle p-4 text-center">
                          No villages loaded. Type your village name below to add it.
                        </p>
                      )}
                      {villages.map((v) => (
                        <button
                          key={`${v.name}-${v.source || 'x'}`}
                          type="button"
                          onClick={() => setSelectedVillage(v)}
                          className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary-muted transition ${
                            selectedVillage?.name === v.name
                              ? 'bg-primary-soft font-medium text-primary-text'
                              : ''
                          }`}
                        >
                          {v.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => { setNewVillageName(villageSearch); setShowAddVillage(true); }}
                        className="sticky bottom-0 w-full bg-primary-muted px-3 py-3 text-left text-sm font-semibold text-primary-text hover:bg-primary-soft"
                      >
                        + Add village
                      </button>
                    </div>

                    {selectedVillage && (
                      <p className="mt-2 text-sm text-primary-text font-medium">
                        Selected: {selectedVillage.name}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {selectedVillage?.lat != null && selectedVillage?.lng != null && (
            <div>
              <label className="block text-sm font-medium mb-1">Location preview</label>
              <VillageMap center={mapCenter} villageName={selectedVillage.name} height={200} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-line py-2.5 font-medium hover:bg-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedVillage || !district}
              className="flex-1 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast py-2.5 font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Spinner className="h-4 w-4" /> : null}
              Save village
            </button>
          </div>
        </form>
      </div>
      {showAddVillage && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddVillage(false); }}>
          <form onSubmit={saveCustomVillage} className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add new village</h3>
              <button type="button" onClick={() => setShowAddVillage(false)} className="text-xl text-text-subtle hover:text-text">×</button>
            </div>
            <label className="mt-5 block text-sm font-medium">District</label>
            <input className="theme-input mt-1" value={district} disabled />
            {subDistrict && <><label className="mt-4 block text-sm font-medium">Sub-district / Tehsil</label><input className="theme-input mt-1" value={subDistrict} disabled /></>}
            <label className="mt-4 block text-sm font-medium">Village name</label>
            <input autoFocus required minLength={2} maxLength={120} className="theme-input mt-1" value={newVillageName} onChange={(e) => setNewVillageName(e.target.value)} placeholder="Enter village name" />
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setShowAddVillage(false)} className="theme-button-secondary flex-1">Cancel</button>
              <button disabled={addingVillage} className="theme-button-primary flex-1">{addingVillage ? 'Adding…' : 'Add village'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
