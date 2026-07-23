const Event = require('../models/Event');
const User = require('../models/User');
const Team = require('../models/Team');
const TeamEvent = require('../models/TeamEvent');
const Notification = require('../models/Notification');
const { deleteCalendarEvent } = require('../services/calendarService');
const apiCache = require('../utils/cache');

/**
 * Finds events whose end date has passed and removes them from
 * every corner of the database AND Google Calendar:
 *   - Google Calendar entries (personal + team)
 *   - User.savedEvents & User.registeredEvents
 *   - Team.events
 *   - TeamEvent join-table entries
 *   - Notification links referencing the event slug
 *   - The Event document itself
 */
async function purgeExpiredEvents() {
  const now = new Date();

  // An event is "expired" when ALL of its meaningful dates are in the past.
  // Priority: eventEnd > endDate > registrationDeadline > date (start date)
  const expiredEvents = await Event.find({
    $expr: {
      $lt: [
        {
          $ifNull: [
            '$eventEnd',
            { $ifNull: ['$endDate', { $ifNull: ['$registrationDeadline', '$date'] }] },
          ],
        },
        now,
      ],
    },
  })
    .select('_id slug team')
    .lean();

  if (!expiredEvents.length) {
    console.log('[Expired Cleanup] No expired events found.');
    return;
  }

  const expiredIds = expiredEvents.map((e) => e._id);
  const expiredSlugs = expiredEvents.map((e) => e.slug).filter(Boolean);

  console.log(
    `[Expired Cleanup] Found ${expiredIds.length} expired event(s). Purging...`
  );

  // ── 1. Remove from Google Calendar (personal saves & registered) ──
  // Find all users who have any of these events saved or registered AND have calendar enabled
  const affectedUsers = await User.find({
    $or: [
      { savedEvents: { $in: expiredIds } },
      { registeredEvents: { $in: expiredIds } },
    ],
    googleRefreshToken: { $exists: true, $ne: null },
    calendarEnabled: true,
  }).select('+googleRefreshToken');

  for (const user of affectedUsers) {
    // Collect all expired event IDs this user has (saved + registered)
    const userExpiredEventIds = [
      ...user.savedEvents.filter((id) => expiredIds.some((eid) => eid.toString() === id.toString())),
      ...user.registeredEvents.filter((id) => expiredIds.some((eid) => eid.toString() === id.toString())),
    ];

    // Deduplicate (an event could be in both saved and registered)
    const uniqueEventIds = [...new Set(userExpiredEventIds.map((id) => id.toString()))];

    for (const eventId of uniqueEventIds) {
      try {
        const gEventId = Buffer.from(user._id.toString() + eventId).toString('hex');
        await deleteCalendarEvent(user, gEventId);
      } catch (err) {
        console.error(`[Expired Cleanup] GCal delete failed for user ${user._id}, event ${eventId}:`, err.message);
      }
    }
  }

  // ── 2. Remove from Google Calendar (team events via TeamEvent) ──
  const teamEventMappings = await TeamEvent.find({
    event: { $in: expiredIds },
    googleEventId: { $exists: true, $ne: null },
  }).populate({
    path: 'team',
    select: 'members',
    populate: { path: 'members', select: '+googleRefreshToken calendarEnabled' },
  });

  for (const mapping of teamEventMappings) {
    if (!mapping.team?.members) continue;
    for (const member of mapping.team.members) {
      if (!member.googleRefreshToken || !member.calendarEnabled) continue;
      try {
        await deleteCalendarEvent(member, mapping.googleEventId);
      } catch (err) {
        console.error(`[Expired Cleanup] Team GCal delete failed:`, err.message);
      }
    }
  }

  // ── 3. Pull from every user's savedEvents & registeredEvents ──
  await User.updateMany(
    {
      $or: [
        { savedEvents: { $in: expiredIds } },
        { registeredEvents: { $in: expiredIds } },
      ],
    },
    {
      $pull: {
        savedEvents: { $in: expiredIds },
        registeredEvents: { $in: expiredIds },
      },
    }
  );

  // ── 4. Pull from every team's events array ──
  await Team.updateMany(
    { events: { $in: expiredIds } },
    { $pull: { events: { $in: expiredIds } } }
  );

  // ── 5. Delete all TeamEvent join-table rows for these events ──
  await TeamEvent.deleteMany({ event: { $in: expiredIds } });

  // ── 6. Delete notifications that link to these event slugs ──
  if (expiredSlugs.length) {
    const slugPatterns = expiredSlugs.map((s) => `/event/${s}`);
    await Notification.deleteMany({ link: { $in: slugPatterns } });
  }

  // ── 7. Delete the event documents themselves ──
  const result = await Event.deleteMany({ _id: { $in: expiredIds } });

  // ── 8. Bust the API response cache so stale events are never served ──
  apiCache.clear();

  console.log(
    `[Expired Cleanup] Purged ${result.deletedCount} expired event(s), cleaned Google Calendar, and removed all references.`
  );
}

module.exports = { purgeExpiredEvents };
