const mongoose = require('mongoose');
const crypto = require('crypto');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  color: { type: String, default: '#ff4d4d' },
  createdAt: { type: Date, default: Date.now },
});

// Auto-generate a 6-character join code
teamSchema.pre('save', function () {
  if (!this.code) {
    this.code = crypto.randomBytes(3).toString('hex').toUpperCase();
  }
});

module.exports = mongoose.model('Team', teamSchema);
