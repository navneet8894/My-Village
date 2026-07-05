import { Country, State, City } from 'country-state-city';
import indiaDistricts from '../data/indiaDistricts';

export function getCountries() {
  return Country.getAllCountries()
    .map((c) => ({
      name: c.name,
      isoCode: c.isoCode,
      flag: c.flag,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getStates(countryCode) {
  if (!countryCode) return [];
  return State.getStatesOfCountry(countryCode)
    .map((s) => ({
      name: s.name,
      isoCode: s.isoCode,
      countryCode: s.countryCode,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getDistricts(countryCode, stateName) {
  if (!countryCode || !stateName) return [];
  if (countryCode === 'IN') {
    return (indiaDistricts[stateName] || [])
      .map((name) => ({ name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  const state = State.getStatesOfCountry(countryCode).find((s) => s.name === stateName);
  if (!state) return [];
  return City.getCitiesOfState(countryCode, state.isoCode)
    .map((c) => ({ name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
