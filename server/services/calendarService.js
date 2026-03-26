const { google } = require('googleapis');

function maskEmail(email) {
  if (!email) return '***';
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}

/**
 * Get an authenticated calendar instance for a user
 */
async function getCalendarClient(refreshToken) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('[Calendar] ERROR: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from environment.');
    throw new Error('Server configuration error: Google credentials missing');
  }

  // Use a fresh client for every request to avoid race conditions with setCredentials
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage'
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Add a hackathon to a user's Google Calendar
 */
async function createCalendarEvent(user, event, existingGoogleEventId = null, context = 'Personal') {
  // Generate a deterministic ID if none provided (for personal saves)
  // Google Event IDs must be [a-v0-9] and 5-1024 chars.
  // We'll use hex(userId + eventId)
  const deterministicId = Buffer.from(user._id.toString() + event._id.toString()).toString('hex');
  const eventIdToUse = existingGoogleEventId || deterministicId;

  console.log(`[Calendar] Syncing: ${event.name} (GID: ${eventIdToUse})`);
  if (!user.googleRefreshToken || !user.calendarEnabled) {
    console.log(`[Calendar] Sync skipped: RefreshToken: ${!!user.googleRefreshToken}, Enabled: ${user.calendarEnabled}`);
    return null;
  }

  try {
    const calendar = await getCalendarClient(user.googleRefreshToken);

    // Skip if user is already registered
    if (user.registeredEvents && user.registeredEvents.some(id => id.toString() === event._id.toString())) {
      console.log(`[Calendar] Sync skipped: User is already REGISTERED for ${event.name}`);
      return null;
    }

    // Ensure targetDate is a valid Date object
    const finalDate = (targetDate instanceof Date) ? targetDate : new Date(targetDate);
    if (isNaN(finalDate.getTime())) {
      console.error(`[Calendar] Invalid target date for ${event.name}: ${targetDate}`);
      return null;
    }

    const calendarEvent = {
      summary: `⏰ [${context}] ${isRegDeadline ? 'Reg. Deadline' : 'Event Ends'}: ${event.name}`,
      location: event.city ? `${event.city}, ${event.state}` : (event.mode || 'Online'),
      description: `${isRegDeadline ? 'Registration deadline' : 'Event concludes'} for ${event.name}.\nSource: ${context}\nLink: ${event.registrationLink}`,
      status: 'confirmed',
      start: {
        dateTime: finalDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(finalDate.getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 }, // 1 day before registration ends
          { method: 'email', minutes: 6 * 60 },  // 6 hours before registration ends
          { method: 'popup', minutes: 60 },      // 1 hour before registration ends
        ],
      },
    };

    console.log(`[Calendar] Sending to Google: ${calendarEvent.summary} at ${finalDate.toISOString()}`);

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventIdToUse,
      resource: calendarEvent,
    }).catch(async (err) => {
      // If patch fails because it doesn't exist, use insert
      if (err.code === 404) {
        return await calendar.events.insert({
          calendarId: 'primary',
          resource: { ...calendarEvent, id: eventIdToUse },
        });
      }
      console.error(`[Calendar] Google API internal error: ${err.code} - ${err.message}`, err.response?.data);
      throw err;
    });

    console.log(`[Calendar] SUCCESS: Event synced: ${response.data.id}`);
    return response.data.id;
  } catch (err) {
    console.error(`[Calendar] CRITICAL ERROR for ${event.name}:`, err.message);
    if (err.response) console.error(`[Calendar] Response data:`, JSON.stringify(err.response.data));
    return null;
  }
}

/**
 * Remove an event from the user's Google Calendar
 */
async function deleteCalendarEvent(user, googleEventId) {
  if (!user.googleRefreshToken || !googleEventId) return;

  try {
    const calendar = await getCalendarClient(user.googleRefreshToken);
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });
    console.log(`[Calendar] Event deleted: ${googleEventId}`);
  } catch (err) {
    if (err.code !== 404 && err.code !== 410) {
      console.error(`[Calendar] Failed to delete event:`, err.message);
    }
  }
}

/**
 * Background sync for all historical events
 */
async function syncAllExistingEvents(user) {
  const Event = require('../models/Event');
  const Team = require('../models/Team');
  const TeamEvent = require('../models/TeamEvent');

  console.log(`[Calendar] Starting full history sync for ${maskEmail(user.email)}...`);

  try {
    // 1. Personal Saved Events
    const personalEvents = await Event.find({ _id: { $in: user.savedEvents || [] } });
    console.log(`[Calendar] Found ${personalEvents.length} personal events to sync.`);
    for (const event of personalEvents) {
      await createCalendarEvent(user, event, null, 'Personal');
    }

    // 2. Team Events
    const myTeams = await Team.find({ members: user._id });
    const teamIds = myTeams.map(t => t._id);
    const teamMappings = await TeamEvent.find({ team: { $in: teamIds } }).populate('event');
    
    // Build team name lookup
    const teamNameMap = new Map();
    myTeams.forEach(t => teamNameMap.set(t._id.toString(), t.name));

    console.log(`[Calendar] Found ${teamMappings.length} team events to sync.`);
    for (const mapping of teamMappings) {
      if (mapping.event) {
        const teamName = teamNameMap.get(mapping.team.toString()) || 'Team';
        const gId = await createCalendarEvent(user, mapping.event, mapping.googleEventId, teamName);
        if (gId && !mapping.googleEventId) {
          mapping.googleEventId = gId;
          await mapping.save();
        }
      }
    }
    console.log(`[Calendar] Full history sync complete for ${maskEmail(user.email)}`);
  } catch (err) {
    console.error(`[Calendar] Full history sync failed:`, err.message);
  }
}

module.exports = {
  createCalendarEvent,
  deleteCalendarEvent,
  syncAllExistingEvents,
};
