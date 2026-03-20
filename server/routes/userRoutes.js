const router = require('express').Router();
const { syncUser, getMe, toggleSaveEvent, saveFcmToken } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/sync', authMiddleware, syncUser);
router.get('/me', authMiddleware, getMe);
router.put('/save/:eventId', authMiddleware, toggleSaveEvent);
router.put('/fcm-token', authMiddleware, saveFcmToken);

module.exports = router;
