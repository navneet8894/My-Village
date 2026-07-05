const express = require('express');
const {
  joinVillage,
  joinVillageValidators,
  getMyVillage,
  getVillageMembers,
} = require('../controllers/villageController');
const { validate } = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/me', getMyVillage);
router.get('/members', getVillageMembers);
router.post('/join', joinVillageValidators, validate, joinVillage);

module.exports = router;
