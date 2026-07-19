const express = require('express');
const {
  getStats,
  listVillages,
  getVillageDetail,
  listUsers,
  banUser,
  unbanUser,
  deleteNewsAdmin,
  postAnnouncement,
  listAnnouncements,
  announcementValidators,
  emergencyAlert,
  emergencyValidators,
  updateVillageLocation,
  villageLocationValidators,
} = require('../controllers/adminController');
const { validate } = require('../middleware/validate');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, adminOnly);

router.get('/stats', getStats);
router.get('/villages', listVillages);
router.get('/villages/:id', getVillageDetail);
router.patch('/villages/:id/location', villageLocationValidators, validate, updateVillageLocation);
router.get('/users', listUsers);
router.post('/users/:id/ban', banUser);
router.post('/users/:id/unban', unbanUser);
router.delete('/news/:id', deleteNewsAdmin);
router.post('/announcements', announcementValidators, validate, postAnnouncement);
router.get('/announcements', listAnnouncements);
router.post('/emergency', emergencyValidators, validate, emergencyAlert);

module.exports = router;
