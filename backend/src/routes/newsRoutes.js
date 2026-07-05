const express = require('express');
const {
  listNews,
  createNews,
  deleteOwnNews,
  newsValidators,
} = require('../controllers/newsController');
const { validate } = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', listNews);
router.post('/', authRequired, newsValidators, validate, createNews);
router.delete('/:id', authRequired, deleteOwnNews);

module.exports = router;
