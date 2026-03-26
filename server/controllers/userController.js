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
    const { firebaseUID, email, displayName, photoURL, fcmToken, googleAuthCode } = req.body;

    if (!firebaseUID || !email) {
      return res.status(400).json({ message: 'firebaseUID and email are required' });
    }

    let user = await User.findOne({ firebaseUID });
    if (user) {
      user.email = email;
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      if (fcmToken && typeof fcmToken === 'string' && fcmToken.length > 20) {
        // Remove this token if it already exists, then add to front
        user.fcmTokens = user.fcmTokens.filter(t => t !== fcmToken);
        user.fcmTokens.unshift(fcmToken);
        // Keep only the latest 3 tokens (multi-device support)
        if (user.fcmTokens.length > 3) {
          user.fcmTokens = user.fcmTokens.slice(0, 3);
        }
      }

      // Handle Google Calendar Token Exchange
      if (googleAuthCode) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          'postmessage'
        );
        const { tokens } = await oauth2Client.getToken(googleAuthCode);
        if (tokens.refresh_token) {
          user.googleRefreshToken = tokens.refresh_token;
          user.calendarEnabled = true;
        }
      }
      await user.save();
    } else {
      user = await User.create({
        firebaseUID, email,
        displayName: displayName || email,
        photoURL: photoURL || '',
        fcmTokens: (fcmToken && typeof fcmToken === 'string' && fcmToken.length > 20) ? [fcmToken] : [],
      });
    }

    // Populate savedEvents before returning to ensure frontend has complete objects
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

// POST /api/users/google-auth — exchange code for tokens and sync
exports.googleAuth = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'postmessage'
    );

    const { tokens } = await oauth2Client.getToken(code);
    const { id_token, refresh_token } = tokens;

    // Verify ID Token to get user details
    const ticket = await oauth2Client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name: displayName, picture: photoURL } = payload;

    // Find user by email (as identity across systems)  
    let user = await User.findOne({ email }).select('+googleRefreshToken');
    if (user) {
      if (refresh_token) {
        user.googleRefreshToken = refresh_token;
        user.calendarEnabled = true;
        console.log(`[GoogleAuth] SUCCESS: Saved refresh token for ${email}`);
      } else {
        console.log(`[GoogleAuth] WARNING: No refresh_token for ${email}. User may have already authorized Trace. Revoke access at myaccount.google.com/connections to reset.`);
      }
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      await user.save();

      // Background sync all existing events
      calendarService.syncAllExistingEvents(user).catch(err => 
        console.error(`[GoogleAuth] Initial sync background error:`, err.message)
      );
    } else {
      user = await User.create({
        firebaseUID: googleId, // Fallback if no existing user
        email,
        displayName: displayName || email,
        photoURL: photoURL || '',
        googleRefreshToken: refresh_token,
        calendarEnabled: !!refresh_token,
      });
      console.log(`[GoogleAuth] Created NEW user: ${email}. HasToken: ${!!refresh_token}`);
      
      // NEW: Also sync for new users!
      if (refresh_token) {
        calendarService.syncAllExistingEvents(user).catch(err => 
          console.error(`[GoogleAuth] New user sync background error:`, err.message)
        );
      }
    }

    res.json({
      firebaseToken: id_token,
      user: user
    });
  } catch (err) {
    console.error('googleAuth error:', err.message);
    res.status(500).json({ message: 'Failed to exchange Google auth code' });
  }
};
