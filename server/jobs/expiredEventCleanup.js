const Event = require('../models/Event');
const User = require('../models/User');
const Team = require('../models/Team');
const TeamEvent = require('../models/TeamEvent');
const Notification = require('../models/Notification');
const apiCache = require('../utils/cache');

/**
 * Finds events whose end date has passed and removes them from
 * every corner of the database:
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
  // We match events where the *best available* end-date field is before now.
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

  // 1. Pull from every user's savedEvents & registeredEvents
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

  // 2. Pull from every team's events array
  await Team.updateMany(
    { events: { $in: expiredIds } },
    { $pull: { events: { $in: expiredIds } } }
  );

  // 3. Delete all TeamEvent join-table rows for these events
  await TeamEvent.deleteMany({ event: { $in: expiredIds } });

  // 4. Delete notifications that link to these event slugs
  if (expiredSlugs.length) {
    const slugPatterns = expiredSlugs.map((s) => `/event/${s}`);
    await Notification.deleteMany({ link: { $in: slugPatterns } });
  }

  // 5. Delete the event documents themselves
  const result = await Event.deleteMany({ _id: { $in: expiredIds } });

  // 6. Bust the API response cache so stale events are never served
  apiCache.clear();

  console.log(
    `[Expired Cleanup] Purged ${result.deletedCount} expired event(s) and all references.`
  );
}

module.exports = { purgeExpiredEvents };
