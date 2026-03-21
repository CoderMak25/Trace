const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  organizer: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: { type: Date },
  registrationDeadline: { type: Date },
  registrationStart: { type: Date },
  mode: { type: String, enum: ['offline', 'online', 'hybrid', 'Online', 'In-Person', 'Hybrid'], default: 'hybrid' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  category: [{ type: String }],
  prizePool: { type: String },
  logoUrl: { type: String },
  isPaid: { type: Boolean, default: false },
  registrationFee: { type: Number, default: 0 },
  teamSize: {
    min: { type: Number },
    max: { type: Number },
  },
  totalRegistrations: { type: Number, default: 0 },
  status: { type: String, default: 'LIVE' },
  notificationsSent: { type: [String], default: [] },
  fees: { type: Number, default: 0 },
  viewsCount: { type: Number, default: 0 },
  registerCount: { type: Number, default: 0 },
  minTeamSize: { type: Number, default: 1 },
  maxTeamSize: { type: Number, default: 1 },
  highlights: { type: String },
  registrationLink: { type: String },
  description: { type: String },
  registered: { type: Boolean, default: false },
  selectionStatus: { type: String, enum: ['Pending', 'Selected', 'Rejected'], default: 'Pending' },
  notifiedMilestones: [{ type: String }],
  verified: { type: Boolean, default: false },
  source: { type: String, default: 'manual' },
  createdAt: { type: Date, default: Date.now },
});

// Auto-generate slug from name
eventSchema.pre('save', function () {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name);
  }
});

module.exports = mongoose.model('Event', eventSchema);
