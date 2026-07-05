const express = require('express');
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  eventValidators,
} = require('../controllers/eventController');
const { validate } = require('../middleware/validate');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', authRequired, adminOnly, eventValidators, validate, createEvent);
router.patch('/:id', authRequired, adminOnly, updateEvent);
router.delete('/:id', authRequired, adminOnly, deleteEvent);

module.exports = router;
