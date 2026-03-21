const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUID: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: { type: String },
  photoURL: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  savedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  fcmTokens: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
