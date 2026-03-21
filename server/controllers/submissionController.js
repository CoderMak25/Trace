const Submission = require('../models/Submission');
const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST /api/submissions
exports.createSubmission = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, organizer, date } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Event name is required' });
    }
    if (!organizer || typeof organizer !== 'string' || organizer.trim().length === 0) {
      return res.status(400).json({ message: 'Organizer is required' });
    }
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: 'Valid event date is required' });
    }

    const submission = new Submission({
      ...req.body,
      name: name.trim(),
      organizer: organizer.trim(),
      submittedBy: user._id,
    });
    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    console.error('createSubmission error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

// GET /api/submissions (Admin only)
exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ status: 'pending' })
      .populate('submittedBy', 'displayName email')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(submissions);
  } catch (err) {
    console.error('getSubmissions error:', err.message);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};

// PUT /api/submissions/:id/approve (Admin only)
exports.approveSubmission = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: `Submission already ${submission.status}` });
    }

    submission.status = 'approved';
    await submission.save();

    const event = new Event({
      name: submission.name,
      slug: submission.slug,
      description: submission.description,
      date: submission.date,
      registrationDeadline: submission.registrationDeadline,
      organizer: submission.organizer,
      category: submission.category,
      mode: submission.mode,
      city: submission.city,
      registrationLink: submission.registrationLink,
      prizePool: submission.prizePool,
    });
    await event.save();

    res.json({ message: 'Submission approved and Event created', event });
  } catch (err) {
    console.error('approveSubmission error:', err.message);
    res.status(500).json({ message: 'Failed to approve submission' });
  }
};

// PUT /api/submissions/:id/reject (Admin only)
exports.rejectSubmission = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: `Submission already ${submission.status}` });
    }

    submission.status = 'rejected';
    await submission.save();
    res.json({ message: 'Submission rejected' });
  } catch (err) {
    console.error('rejectSubmission error:', err.message);
    res.status(500).json({ message: 'Failed to reject submission' });
  }
};
