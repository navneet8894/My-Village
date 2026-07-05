const express = require('express');
const {
  getMyFamily,
  addMember,
  addMemberValidators,
  setHead,
  setHeadValidators,
  removeMember,
} = require('../controllers/familyController');
const { validate } = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/', getMyFamily);
router.post('/members', addMemberValidators, validate, addMember);
router.post('/head', setHeadValidators, validate, setHead);
router.delete('/members/:memberId', removeMember);

module.exports = router;
