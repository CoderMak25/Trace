const router = require('express').Router();
const { getEvents, getEventBySlug, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
router.get('/', optionalAuthMiddleware, getEvents);
router.get('/:slug', optionalAuthMiddleware, getEventBySlug);
router.post('/', authMiddleware, createEvent);
router.put('/:id', authMiddleware, updateEvent);
router.delete('/:id', authMiddleware, deleteEvent);

module.exports = router;
