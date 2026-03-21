const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['team_announcement', 'deadline_reminder', 'system'], default: 'system' },
  link: { type: String }, // e.g. /teams/123 or /event/some-slug
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
