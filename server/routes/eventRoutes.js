const router = require('express').Router();
const { getEvents, getEventBySlug, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/', getEvents);
router.get('/:slug', getEventBySlug);
router.post('/', authMiddleware, adminMiddleware, createEvent);
router.put('/:id', authMiddleware, adminMiddleware, updateEvent);
router.delete('/:id', authMiddleware, adminMiddleware, deleteEvent);

module.exports = router;
