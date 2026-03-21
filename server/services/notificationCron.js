const cron = require('node-cron');
const Event = require('../models/Event');
const User = require('../models/User');
const Team = require('../models/Team');
const admin = require('../config/firebaseAdmin');

const MILESTONES = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '12h', hours: 12 },
  { label: '1d', hours: 24 },
  { label: '2d', hours: 48 },
];

async function checkDeadlines() {
  try {
    // Find all events with a deadline in the future that aren't fully registered yet
    const events = await Event.find({
      registered: false,
      registrationDeadline: { $gte: new Date() }
    });

    for (const event of events) {
      const msRemaining = event.registrationDeadline.getTime() - Date.now();
      const hoursRemaining = msRemaining / (1000 * 60 * 60);

      // Check which milestones have been crossed but not notified
      for (const milestone of MILESTONES) {
        if (hoursRemaining <= milestone.hours && !event.notifiedMilestones.includes(milestone.label)) {
          // Send Notification
          await sendDeadlineNotification(event, milestone.label);
          // Mark as notified
          event.notifiedMilestones.push(milestone.label);
          await event.save();
          break; // Stop checking milestones for this event on this loop (one per interval to avoid spam)
        }
      }
    }
  } catch (err) {
    console.error('Cron job error:', err.message);
  }
}

async function sendDeadlineNotification(event, milestoneLabel) {
  let targetUsers = [];
  
  if (event.team) {
    // Notify all members of the team
    const team = await Team.findById(event.team).populate('members');
    if (team) {
      targetUsers = team.members;
    }
  } else if (event.owner) {
    // Only the single owner
    const owner = await User.findById(event.owner);
    if (owner) targetUsers.push(owner);
  }

  // Filter users who have allowed FCM
  const tokens = targetUsers
    .flatMap(u => (u && u.fcmTokens) ? u.fcmTokens : [])
    .filter(t => typeof t === 'string' && t.length > 0);

  if (tokens.length === 0) return;

  // Format nice strings
  const displayLabel = milestoneLabel.replace('d', ' days').replace('h', ' hours').replace('1 days', '1 day').replace('1 hours', '1 hour');

  const message = {
    notification: {
      title: 'Registration Closing Soon! ⏰',
      body: `The deadline for ${event.name} ends in ${displayLabel}! Don't forget to register.`,
    },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    
    const Notification = require('../models/Notification');
    const dbNotifs = targetUsers.map(u => ({
      userId: u._id,
      title: message.notification.title,
      body: message.notification.body,
      type: 'deadline_reminder',
      link: `/event/${event.slug}`
    }));
    if (dbNotifs.length > 0) {
      await Notification.insertMany(dbNotifs);
    }

    console.log(`FCM Deadline Sent [${event.name}] (${milestoneLabel}). Success: ${response.successCount}`);
  } catch (err) {
    console.error('FCM Send Multicast Error:', err.message);
  }
}

// Run the check every 5 minutes
cron.schedule('*/5 * * * *', () => {
  checkDeadlines();
});
console.log('[CRON] Notification Service Started');
