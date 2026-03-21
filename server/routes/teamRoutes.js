const router = require('express').Router();
const {
  createTeam,
  joinTeam,
  getMyTeams,
  getTeam,
  addEventToTeam,
  removeEventFromTeam,
  updateTeam,
  leaveTeam,
  deleteTeam,
  sendTeamAnnouncement,
  selectEventForTeam,
  getTeamSelectedEvents,
  unselectEventForTeam,
  markTeamEventInterested,
} = require('../controllers/teamController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Strict limiter for push notifications to prevent spam & Firebase quota exhaustion
const announceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 announcements per window
  message: { message: 'Too many announcements sent. Please wait 15 minutes.' }
});

router.post('/', authMiddleware, createTeam);
router.post('/join', authMiddleware, joinTeam);
router.get('/', authMiddleware, getMyTeams);
router.get('/:id', authMiddleware, getTeam);
router.put('/:id', authMiddleware, updateTeam);
router.put('/:id/add-event', authMiddleware, addEventToTeam);
router.put('/:id/remove-event', authMiddleware, removeEventFromTeam);
router.delete('/:id/leave', authMiddleware, leaveTeam);
router.delete('/:id', authMiddleware, deleteTeam);
router.post('/:id/announce', authMiddleware, announceLimiter, sendTeamAnnouncement);
router.post('/:id/select-event', authMiddleware, selectEventForTeam);
router.get('/:id/selected-events', authMiddleware, getTeamSelectedEvents);
router.delete('/:id/select-event/:eventId', authMiddleware, unselectEventForTeam);
router.put('/:id/select-event/:eventId/interest', authMiddleware, markTeamEventInterested);

module.exports = router;
