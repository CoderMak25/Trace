const router = require('express').Router();
const { syncUser, getMe, toggleSaveEvent, toggleRegisterEvent, saveFcmToken, googleAuth } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/sync', authMiddleware, syncUser);
router.post('/google-auth', googleAuth);
router.get('/me', authMiddleware, getMe);
router.put('/save/:eventId', authMiddleware, toggleSaveEvent);
router.put('/register/:eventId', authMiddleware, toggleRegisterEvent);
router.put('/fcm-token', authMiddleware, saveFcmToken);

module.exports = router;
