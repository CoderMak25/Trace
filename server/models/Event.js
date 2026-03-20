const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  organizer: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: { type: Date },
  registrationDeadline: { type: Date },
  mode: { type: String, enum: ['Online', 'In-Person', 'Hybrid'], default: 'In-Person' },
  city: { type: String },
  category: [{ type: String }],
  prizePool: { type: String },
  highlights: { type: String },
  registrationLink: { type: String },
  description: { type: String },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Auto-generate slug from name
eventSchema.pre('save', function () {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name);
  }
});

module.exports = mongoose.model('Event', eventSchema);
