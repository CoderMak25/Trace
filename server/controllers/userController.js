const User = require('../models/User');
const Event = require('../models/Event');
const mongoose = require('mongoose');
const { google } = require('googleapis');
const calendarService = require('../services/calendarService');

// Helper: validate ObjectId format
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST /api/users/sync — create or update user on login
exports.syncUser = async (req, res) => {
  try {
    const { firebaseUID, email, displayName, photoURL, fcmToken, googleRefreshToken } = req.body;

    if (!firebaseUID || !email) {
      return res.status(400).json({ message: 'firebaseUID and email are required' });
    }

    let user = await User.findOne({ firebaseUID }).select('+googleRefreshToken');
    
    // FALLBACK: If not found by UID, check by email (handles edge cases)
    if (!user) {
      user = await User.findOne({ email }).select('+googleRefreshToken');
      if (user) {
        console.log(`[SyncUser] Merging user ${email}: old UID ${user.firebaseUID} → new UID ${firebaseUID}`);
        user.firebaseUID = firebaseUID;
      }
    }

    if (user) {
      user.email = email;
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      if (fcmToken && typeof fcmToken === 'string' && fcmToken.length > 20) {
        user.fcmTokens = user.fcmTokens.filter(t => t !== fcmToken);
        user.fcmTokens.unshift(fcmToken);
        if (user.fcmTokens.length > 3) {
          user.fcmTokens = user.fcmTokens.slice(0, 3);
        }
      }

      // Store Google Refresh Token if provided (from the frontend after google-auth exchange)
      if (googleRefreshToken) {
        user.googleRefreshToken = googleRefreshToken;
        user.calendarEnabled = true;
        console.log(`[SyncUser] Stored Google refresh token for ${email} (UID: ${firebaseUID})`);
      }

      await user.save();

      // Background sync if we just received a new refresh token
      if (googleRefreshToken) {
        calendarService.syncAllExistingEvents(user).catch(err =>
          console.error(`[SyncUser] Background GCal sync error:`, err.message)
        );
      }
    } else {
      user = await User.create({
        firebaseUID, email,
        displayName: displayName || email,
        photoURL: photoURL || '',
        fcmTokens: (fcmToken && typeof fcmToken === 'string' && fcmToken.length > 20) ? [fcmToken] : [],
        googleRefreshToken: googleRefreshToken || undefined,
        calendarEnabled: !!googleRefreshToken,
      });
      console.log(`[SyncUser] Created NEW user: ${email}, HasToken: ${!!googleRefreshToken}`);
    }

    // Populate savedEvents before returning
    const populatedUser = await User.findById(user._id)
      .populate({ path: 'savedEvents', populate: { path: 'team', select: 'name' } })
      .populate('registeredEvents');
    res.json(populatedUser);
  } catch (err) {
    console.error('syncUser error:', err.message);
    res.status(500).json({ message: 'Failed to sync user' });
  }
};

// GET /api/users/me — current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid })
      .populate({ path: 'savedEvents', populate: { path: 'team', select: 'name' } })
      .populate('registeredEvents');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('getMe error:', err.message);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

// PUT /api/users/save/:eventId — toggle bookmark
exports.toggleSaveEvent = async (req, res) => {
  try {
    if (!isValidId(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const user = await User.findOne({ firebaseUID: req.user.uid }).select('+googleRefreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const eventId = req.params.eventId;
    const idx = user.savedEvents.findIndex(id => id.toString() === eventId);
    
    if (idx > -1) {
      // Unsave logic
      user.savedEvents.splice(idx, 1);
      
      // Delete from Google Calendar using deterministic ID
      if (user.googleRefreshToken && user.calendarEnabled) {
        const gEventId = Buffer.from(user._id.toString() + eventId).toString('hex');
        await calendarService.deleteCalendarEvent(user, gEventId);
      }
    } else {
      // Save logic
      user.savedEvents.push(eventId);
      
      const event = await Event.findById(eventId);
      console.log(`[SaveEvent] Event: ${event?.name}, HasToken: ${!!user.googleRefreshToken}, Enabled: ${user.calendarEnabled}`);
      if (event && user.googleRefreshToken && user.calendarEnabled) {
        await calendarService.createCalendarEvent(user, event, null, 'Personal');
      }
    }
    await user.save();
    
    // Repopulate manually to return full objects to the frontend context
    const populatedUser = await User.findById(user._id).populate({
      path: 'savedEvents',
      populate: { path: 'team', select: 'name' }
    });
    
    res.json({ savedEvents: populatedUser.savedEvents });
  } catch (err) {
    console.error('toggleSaveEvent error:', err.message);
    res.status(500).json({ message: 'Failed to toggle save' });
  }
};

// PUT /api/users/register/:eventId — toggle registered status
exports.toggleRegisterEvent = async (req, res) => {
  try {
    if (!isValidId(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const user = await User.findOne({ firebaseUID: req.user.uid }).select('+googleRefreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const eventId = req.params.eventId;
    const idx = user.registeredEvents.findIndex(id => id.toString() === eventId);
    const wasRegistered = idx > -1;

    if (wasRegistered) {
      user.registeredEvents.splice(idx, 1);
    } else {
      user.registeredEvents.push(eventId);
    }
    await user.save();

    // Sync to Google Calendar
    const event = await Event.findById(eventId);
    if (event && user.googleRefreshToken && user.calendarEnabled) {
      const gEventId = Buffer.from(user._id.toString() + event._id.toString()).toString('hex');
      if (!wasRegistered) {
        // Just registered → remove GCal reminder (no more nagging)
        await calendarService.deleteCalendarEvent(user, gEventId);
        console.log(`[Register] Removed GCal reminder for ${event.name} (user registered)`);
      } else {
        // Un-registered → re-add the deadline reminder
        await calendarService.createCalendarEvent(user, event, null, 'Personal');
        console.log(`[Register] Re-added GCal reminder for ${event.name} (registration removed)`);
      }
    }

    res.json({
      message: wasRegistered ? 'Registration removed' : 'Marked as registered',
      registeredEvents: user.registeredEvents,
    });
  } catch (err) {
    console.error('toggleRegisterEvent error:', err.message);
    res.status(500).json({ message: 'Error toggling registration' });
  }
};

// PUT /api/users/fcm-token — save FCM token (multi-device)
exports.saveFcmToken = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { fcmToken } = req.body;
    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 20) {
      return res.status(400).json({ message: 'Valid FCM token is required' });
    }

    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      if (user.fcmTokens.length > 10) {
        user.fcmTokens = user.fcmTokens.slice(-10);
      }
      await user.save();
    }
    res.json({ message: 'Token saved' });
  } catch (err) {
    console.error('saveFcmToken error:', err.message);
    res.status(500).json({ message: 'Failed to save token' });
  }
};

// POST /api/users/google-auth — exchange code for tokens ONLY
// Does NOT create or modify users — that's syncUser's job
exports.googleAuth = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });

    if (!process.env.GOOGLE_CLIENT_SECRET) {
      console.error('[GoogleAuth] CRITICAL: GOOGLE_CLIENT_SECRET missing');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'postmessage'
    );

    const { tokens } = await oauth2Client.getToken(code);
    console.log(`[GoogleAuth] Tokens received: ID:${!!tokens.id_token}, Refresh:${!!tokens.refresh_token}`);

    // Just return the tokens to the frontend — syncUser will handle storing them
    res.json({
      firebaseToken: tokens.id_token,
      refreshToken: tokens.refresh_token || null,
    });
  } catch (err) {
    console.error('googleAuth error:', err.message);
    res.status(500).json({ message: 'Failed to exchange Google auth code' });
  }
};
