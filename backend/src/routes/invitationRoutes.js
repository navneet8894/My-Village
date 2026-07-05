const express = require('express');
const {
  listInvitations,
  createInvitation,
  invitationValidators,
} = require('../controllers/invitationController');
const { validate } = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', listInvitations);
router.post('/', authRequired, invitationValidators, validate, createInvitation);

module.exports = router;
