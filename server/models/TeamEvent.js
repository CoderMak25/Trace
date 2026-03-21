const mongoose = require('mongoose');

const teamEventSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['Saved', 'Interested', 'Applied', 'Submitted'],
      default: 'Saved',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

teamEventSchema.index({ team: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('TeamEvent', teamEventSchema);
