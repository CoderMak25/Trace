const Submission = require('../models/Submission');
const Event = require('../models/Event');
const User = require('../models/User');

// POST /api/submissions
exports.createSubmission = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const submission = new Submission({
      ...req.body,
      submittedBy: user._id,
    });
    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/submissions (Admin only)
exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ status: 'pending' })
      .populate('submittedBy', 'displayName email')
      .sort({ createdAt: 1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/submissions/:id/approve (Admin only)
exports.approveSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.status = 'approved';
    await submission.save();

    // Create Event
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
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/submissions/:id/reject (Admin only)
exports.rejectSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.status = 'rejected';
    await submission.save();
    res.json({ message: 'Submission rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
