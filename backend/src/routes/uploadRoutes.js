const express = require('express');
const { uploadMedia } = require('../controllers/uploadController');
const { upload } = require('../middleware/upload');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/', authRequired, upload.single('file'), uploadMedia);

module.exports = router;
