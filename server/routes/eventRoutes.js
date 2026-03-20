const router = require('express').Router();
const { getEvents, getEventBySlug, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
router.get('/', authMiddleware, getEvents);
router.get('/:slug', authMiddleware, getEventBySlug);
router.post('/', authMiddleware, createEvent);
router.put('/:id', authMiddleware, updateEvent);
router.delete('/:id', authMiddleware, deleteEvent);

module.exports = router;
