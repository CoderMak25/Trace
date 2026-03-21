const router = require('express').Router();
const { sendToAll, deadlineCheck, getUserNotifications, markAsRead } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Get current user's historic notifications
router.get('/my-notifications', authMiddleware, getUserNotifications);
router.put('/my-notifications/read', authMiddleware, markAsRead);

// System endpoints
router.post('/send', authMiddleware, adminMiddleware, sendToAll);
router.post('/deadline-check', deadlineCheck);

module.exports = router;
