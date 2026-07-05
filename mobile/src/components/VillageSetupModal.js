import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Country, State, City } from 'country-state-city';
import { api } from '../api';
import { setUser } from '../store';
import Toast from '../utils/toast';
import { fetchVillagesClient } from '../utils/villageSearch';
import indiaDistricts from '../data/indiaDistricts';

function getCountries() {
  return Country.getAllCountries()
    .map((c) => ({ name: c.name, isoCode: c.isoCode, flag: c.flag }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getStates(countryCode) {
  if (!countryCode) return [];
  return State.getStatesOfCountry(countryCode)
    .map((s) => ({ name: s.name, isoCode: s.isoCode }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getDistricts(countryCode, stateName) {
  if (!countryCode || !stateName) return [];
  if (countryCode === 'IN') {
    return (indiaDistricts[stateName] || []).map((name) => ({ name }));
  }
  const state = State.getStatesOfCountry(countryCode).find((s) => s.name === stateName);
  if (!state) return [];
  return City.getCitiesOfState(countryCode, state.isoCode).map((c) => ({ name: c.name }));
}

function SelectField({ label, value, options, onOpen, onSelect, disabled, loading }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.select, disabled && styles.disabled]}
        onPress={() => {
          if (disabled) return;
          if (onOpen && onOpen() === false) return;
          setOpen(true);
        }}
        disabled={disabled}
      >
        <Text style={value ? styles.selectText : styles.placeholder}>
          {loading ? 'Loading…' : value || `Select ${label.toLowerCase()}`}
        </Text>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerBox}>
            <Text style={styles.pickerTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.length === 0 ? (
                <Text style={styles.emptyPicker}>No options available</Text>
              ) : (
                options.map((opt) => (
                  <TouchableOpacity
                    key={typeof opt === 'string' ? opt : opt.value || opt.name}
                    style={styles.pickerItem}
                    onPress={() => {
                      onSelect(typeof opt === 'string' ? opt : opt);
                      setOpen(false);
                    }}
                  >
                    <Text>{typeof opt === 'string' ? opt : opt.label || opt.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function VillageSetupModal({ visible, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const user = useSelector((s) => s.auth.user);

  const countries = useMemo(() => getCountries(), []);

  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [villageSearch, setVillageSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [allVillages, setAllVillages] = useState([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [saving, setSaving] = useState(false);

  const states = useMemo(() => getStates(countryCode), [countryCode]);
  const districts = useMemo(() => getDistricts(countryCode, stateName), [countryCode, stateName]);

  useEffect(() => {
    if (!visible) return;
    setCountryCode('');
    setCountryName('');
    setStateCode('');
    setStateName('');
    setDistrict('');
    setVillageSearch('');
    setSelectedVillage(null);
    setAllVillages([]);
  }, [visible]);

  useEffect(() => {
    if (!countryName || !stateName || !district || !visible) {
      setAllVillages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingVillages(true);
      let apiList = [];
      let clientList = [];
      try {
        apiList = await api(
          `/public/location/villages?country=${encodeURIComponent(countryName)}&state=${encodeURIComponent(stateName)}&district=${encodeURIComponent(district)}`
        );
      } catch {
        apiList = [];
      }
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
      for (const list of [apiList, clientList]) {
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
      if (!cancelled) setLoadingVillages(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [countryName, stateName, district, visible]);

  const villages = villageSearch.trim()
    ? allVillages.filter((v) => v.name.toLowerCase().includes(villageSearch.trim().toLowerCase()))
    : allVillages;

  const canAddCustom =
    villageSearch.trim().length >= 2 &&
    !allVillages.some((v) => v.name.toLowerCase() === villageSearch.trim().toLowerCase());

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

  async function handleSave() {
    if (!requireCountry() || !requireState() || !district) {
      if (!district) Toast.error('Please select the district first');
      return;
    }
    if (!selectedVillage) {
      Toast.error('Please select a village');
      return;
    }
    setSaving(true);
    try {
      const body = {
        country: countryName,
        countryCode,
        state: stateName,
        stateCode,
        district,
        village: selectedVillage.name,
      };
      if (selectedVillage.lat != null && selectedVillage.lng != null) {
        body.lat = selectedVillage.lat;
        body.lng = selectedVillage.lng;
      }
      if (selectedVillage.placeId) body.placeId = selectedVillage.placeId;
      if (selectedVillage.formattedAddress) body.formattedAddress = selectedVillage.formattedAddress;

      const res = await api('/villages/join', {
        method: 'POST',
        token,
        body,
      });
      dispatch(setUser(res.user));
      Toast.success('Village saved!');
      onSuccess?.(res);
      onClose();
    } catch (e) {
      Toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (user?.villageId) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.blockedBox}>
          <Text style={styles.title}>Village already set</Text>
          <Text style={styles.blockedText}>
            You are registered to {user.villageLocation?.village || 'your village'}. A user can only
            register to one village.
          </Text>
          <TouchableOpacity style={styles.saveBtn} onPress={onClose}>
            <Text style={styles.saveText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add your village</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <SelectField
          label="Country"
          value={countryName}
          options={countries.map((c) => ({
            label: c.name,
            value: c.isoCode,
            name: c.name,
          }))}
          onSelect={(c) => {
            setCountryCode(c.value);
            setCountryName(c.name);
            setStateName('');
            setStateCode('');
            setDistrict('');
            setSelectedVillage(null);
          }}
        />

        <SelectField
          label="State"
          value={stateName}
          options={states.map((s) => s.name)}
          onOpen={requireCountry}
          onSelect={(name) => {
            if (!requireCountry()) return;
            const s = states.find((x) => x.name === name);
            setStateName(name);
            setStateCode(s?.isoCode || '');
            setDistrict('');
            setSelectedVillage(null);
          }}
        />

        <SelectField
          label="District"
          value={district}
          options={districts.map((d) => d.name)}
          onOpen={requireState}
          onSelect={(name) => {
            if (!requireState()) return;
            setDistrict(name);
            setSelectedVillage(null);
            setVillageSearch('');
          }}
        />

        {!district ? (
          <Text style={styles.hint}>Select a district to see village names</Text>
        ) : (
          <>
            <Text style={styles.label}>Filter village</Text>
            <TextInput
              style={styles.input}
              placeholder="Type to filter or add village name…"
              value={villageSearch}
              onChangeText={(text) => {
                setVillageSearch(text);
                setSelectedVillage(null);
              }}
            />

            {loadingVillages ? (
              <Text style={styles.hint}>Loading villages for {district}…</Text>
            ) : (
              <>
                <Text style={styles.hint}>
                  {villageSearch
                    ? `${villages.length} matches of ${allVillages.length} villages`
                    : `${allVillages.length} villages in ${district}`}
                </Text>
                <SelectField
                  label="Select village"
                  value={selectedVillage?.name}
                  options={villages.map((v) => v.name)}
                  onSelect={(name) => setSelectedVillage(villages.find((v) => v.name === name) || null)}
                />
                {canAddCustom && (
                  <TouchableOpacity
                    style={styles.addCustomBtn}
                    onPress={() => {
                      const name = villageSearch.trim();
                      setSelectedVillage({
                        name,
                        lat: null,
                        lng: null,
                        placeId: '',
                        formattedAddress: `${name}, ${district}, ${stateName}, ${countryName}`,
                        source: 'custom',
                      });
                      Toast.success(`"${name}" selected — tap Save village`);
                    }}
                  >
                    <Text style={styles.addCustomText}>+ Add &quot;{villageSearch.trim()}&quot; as my village</Text>
                  </TouchableOpacity>
                )}
                {selectedVillage && (
                  <Text style={styles.selectedText}>Selected: {selectedVillage.name}</Text>
                )}
              </>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save village</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700' },
  close: { fontSize: 22, color: '#94a3b8' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#334155' },
  select: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectText: { fontSize: 15 },
  placeholder: { fontSize: 15, color: '#94a3b8' },
  disabled: { opacity: 0.5 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerBox: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  pickerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  pickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  emptyPicker: { padding: 16, color: '#94a3b8', textAlign: 'center' },
  cancelBtn: { marginTop: 12, padding: 14, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  blockedBox: { flex: 1, justifyContent: 'center', padding: 24 },
  blockedText: { marginTop: 12, color: '#64748b', lineHeight: 22, textAlign: 'center' },
  hint: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  addCustomBtn: {
    borderWidth: 2,
    borderColor: '#6ee7b7',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  addCustomText: { color: '#047857', fontWeight: '600', fontSize: 14 },
  selectedText: { color: '#047857', fontWeight: '600', marginBottom: 12 },
});
