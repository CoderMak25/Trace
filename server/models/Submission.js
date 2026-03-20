const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  registrationDeadline: { type: Date },
  organizer: { type: String, required: true },
  category: {
    type: String,
    enum: ['Hackathon', 'Workshop', 'Tech Fest', 'Coding Contest', 'Other'],
    required: true,
  },
  mode: {
    type: String,
    enum: ['Online', 'In-Person', 'Hybrid'],
    required: true,
  },
  city: { type: String, default: 'Online' },
  registrationLink: { type: String, required: true },
  prizePool: { type: String, default: 'Free' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now }
});

submissionSchema.pre('validate', function() {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name) + '-' + Date.now().toString(36);
  }
});

module.exports = mongoose.model('Submission', submissionSchema);
