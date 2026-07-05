const express = require('express');
const { listMyNotifications, markRead } = require('../controllers/notificationController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/', listMyNotifications);
router.post('/read', markRead);

module.exports = router;
