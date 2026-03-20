const router = require('express').Router();
const { sendToAll, deadlineCheck } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/send', authMiddleware, adminMiddleware, sendToAll);
router.post('/deadline-check', deadlineCheck);

module.exports = router;
