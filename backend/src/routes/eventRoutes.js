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
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, listEvents);
router.get('/:id', authRequired, getEvent);
router.post('/', authRequired, eventValidators, validate, createEvent);
router.patch('/:id', authRequired, eventValidators, validate, updateEvent);
router.delete('/:id', authRequired, deleteEvent);

module.exports = router;
