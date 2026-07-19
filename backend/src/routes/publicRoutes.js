const express = require('express');
const {
  getCountries,
  getStates,
  getDistricts,
  getSubDistricts,
  getVillages,
  searchPlaces,
} = require('../controllers/locationController');

const router = express.Router();

router.get('/location/countries', getCountries);
router.get('/location/states/:countryCode', getStates);
router.get('/location/districts', getDistricts);
router.get('/location/subdistricts', getSubDistricts);
router.get('/location/villages', getVillages);
router.get('/location/search', searchPlaces);

router.get('/map-config', (req, res) => {  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    defaultCenter: {
      lat: Number(process.env.VILLAGE_DEFAULT_LAT || 20.5937),
      lng: Number(process.env.VILLAGE_DEFAULT_LNG || 78.9629),
    },
  });
});

module.exports = router;
