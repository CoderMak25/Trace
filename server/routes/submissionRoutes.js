const router = require('express').Router();
const {
  createSubmission,
  getSubmissions,
  approveSubmission,
  rejectSubmission
} = require('../controllers/submissionController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/', authMiddleware, createSubmission);
router.get('/', authMiddleware, adminMiddleware, getSubmissions);
router.put('/:id/approve', authMiddleware, adminMiddleware, approveSubmission);
router.put('/:id/reject', authMiddleware, adminMiddleware, rejectSubmission);

module.exports = router;
