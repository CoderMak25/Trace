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
} = require('../controllers/teamController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createTeam);
router.post('/join', authMiddleware, joinTeam);
router.get('/', authMiddleware, getMyTeams);
router.get('/:id', authMiddleware, getTeam);
router.put('/:id', authMiddleware, updateTeam);
router.put('/:id/add-event', authMiddleware, addEventToTeam);
router.put('/:id/remove-event', authMiddleware, removeEventFromTeam);
router.delete('/:id/leave', authMiddleware, leaveTeam);

module.exports = router;
