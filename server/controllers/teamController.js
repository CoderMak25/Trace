const Team = require('../models/Team');
const User = require('../models/User');
const admin = require('../config/firebaseAdmin');
const mongoose = require('mongoose');

// In-memory cache for ultra-fast GET responses
const apiCache = require('../utils/cache');

// Helper: validate ObjectId format
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST /api/teams — create a team
exports.createTeam = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, description, color } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Team name is required' });
    }
    if (name.trim().length > 50) {
      return res.status(400).json({ message: 'Team name must be 50 characters or less' });
    }
    if (description && description.length > 200) {
      return res.status(400).json({ message: 'Description must be 200 characters or less' });
    }

    const team = new Team({
      name: name.trim(),
      description: (description || '').trim(),
      color: color || '#ff4d4d',
      owner: user._id,
      members: [user._id],
    });
    await team.save();

    apiCache.clear();
    res.status(201).json(team);
  } catch (err) {
    console.error('createTeam error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

// POST /api/teams/join — join a team by code
exports.joinTeam = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { code } = req.body;
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({ message: 'Team code is required' });
    }

    const team = await Team.findOne({ code: code.trim().toUpperCase() });
    if (!team) return res.status(404).json({ message: 'Team not found. Check the code and try again.' });

    if (team.members.some(id => id.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'You are already a member of this team.' });
    }

    team.members.push(user._id);
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('members', 'displayName email photoURL')
      .populate('events')
      .populate('owner', 'displayName email');

    apiCache.clear();
    res.json(populated);
  } catch (err) {
    console.error('joinTeam error:', err.message);
    res.status(500).json({ message: 'Failed to join team' });
  }
};

// GET /api/teams — get all teams the user belongs to
exports.getMyTeams = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const cacheKey = `teams_${user._id}`;
    if (apiCache.has(cacheKey)) {
      return res.json(apiCache.get(cacheKey));
    }

    const teams = await Team.find({ members: user._id })
      .populate('members', 'displayName email photoURL')
      .populate('events')
      .populate('owner', 'displayName email')
      .sort({ createdAt: -1 });

    apiCache.set(cacheKey, teams);
    setTimeout(() => apiCache.delete(cacheKey), 2 * 60 * 1000);

    res.json(teams);
  } catch (err) {
    console.error('getMyTeams error:', err.message);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
};

// GET /api/teams/:id — get single team
exports.getTeam = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const cacheKey = `team_${req.params.id}`;
    if (apiCache.has(cacheKey)) {
      return res.json(apiCache.get(cacheKey));
    }

    const team = await Team.findById(req.params.id)
      .populate('members', 'displayName email photoURL')
      .populate('events')
      .populate('owner', 'displayName email');
    if (!team) return res.status(404).json({ message: 'Team not found' });
    
    apiCache.set(cacheKey, team);
    setTimeout(() => apiCache.delete(cacheKey), 2 * 60 * 1000);
    
    res.json(team);
  } catch (err) {
    console.error('getTeam error:', err.message);
    res.status(500).json({ message: 'Failed to fetch team' });
  }
};

// PUT /api/teams/:id/add-event — add event to team schedule
exports.addEventToTeam = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!team.members.some(id => id.toString() === user._id.toString())) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    const { eventId } = req.body;
    if (!eventId || !isValidId(eventId)) {
      return res.status(400).json({ message: 'Valid event ID is required' });
    }

    if (team.events.some(id => id.toString() === eventId)) {
      return res.json({ message: 'Event already in team schedule' });
    }

    team.events.push(eventId);
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('events')
      .populate('members', 'displayName email photoURL')
      .populate('owner', 'displayName email');
    
    apiCache.clear();
    res.json(populated);
  } catch (err) {
    console.error('addEventToTeam error:', err.message);
    res.status(500).json({ message: 'Failed to add event' });
  }
};

// PUT /api/teams/:id/remove-event — remove event from team schedule
exports.removeEventFromTeam = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!team.members.some(id => id.toString() === user._id.toString())) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    const { eventId } = req.body;
    if (!eventId || !isValidId(eventId)) {
      return res.status(400).json({ message: 'Valid event ID is required' });
    }

    team.events = team.events.filter((id) => id.toString() !== eventId);
    await team.save();

    // Cascading delete the actual event since it was removed from the team
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (event && event.team && event.team.toString() === team._id.toString()) {
      await User.updateMany(
        { savedEvents: event._id },
        { $pull: { savedEvents: event._id } }
      );
      const Notification = require('../models/Notification');
      await Notification.deleteMany({ link: `/event/${event.slug}` });
      await Event.findByIdAndDelete(eventId);
    }

    apiCache.clear();
    res.json({ message: 'Event permanently deleted from team schedule' });
  } catch (err) {
    console.error('removeEventFromTeam error:', err.message);
    res.status(500).json({ message: 'Failed to remove event' });
  }
};

// PUT /api/teams/:id — update team details (owner only)
exports.updateTeam = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (team.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the team owner can update details' });
    }

    const { name, description, color } = req.body;
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Team name cannot be empty' });
      }
      if (name.trim().length > 50) {
        return res.status(400).json({ message: 'Team name must be 50 characters or less' });
      }
      team.name = name.trim();
    }
    if (description !== undefined) team.description = (description || '').trim();
    if (color) team.color = color;
    await team.save();

    apiCache.clear();
    res.json(team);
  } catch (err) {
    console.error('updateTeam error:', err.message);
    res.status(500).json({ message: 'Failed to update team' });
  }
};

// DELETE /api/teams/:id/leave — leave a team
exports.leaveTeam = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (team.owner.toString() === user._id.toString()) {
      await cascadeDeleteTeam(team);
      apiCache.clear();
      return res.json({ message: 'Team dissolved. All events, notifications, and member links cleaned up.' });
    }

    if (!team.members.some(id => id.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'You are not a member of this team' });
    }

    team.members = team.members.filter((id) => id.toString() !== user._id.toString());
    await team.save();
    apiCache.clear();
    res.json({ message: 'Left team' });
  } catch (err) {
    console.error('leaveTeam error:', err.message);
    res.status(500).json({ message: 'Failed to leave team' });
  }
};

// DELETE /api/teams/:id — delete team entirely (owner only)
exports.deleteTeam = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (team.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the team owner can delete the team.' });
    }

    await cascadeDeleteTeam(team);
    apiCache.clear();
    res.json({ message: 'Team deleted. All events, notifications, and member links cleaned up.' });
  } catch (err) {
    console.error('deleteTeam error:', err.message);
    res.status(500).json({ message: 'Failed to delete team' });
  }
};

// Helper: fully cascade-delete a team and all associated data
async function cascadeDeleteTeam(team) {
  const Event = require('../models/Event');
  const Notification = require('../models/Notification');

  const teamEventIds = team.events.map(id => id.toString());

  await Event.deleteMany({ _id: { $in: teamEventIds } });
  await Event.deleteMany({ team: team._id });

  if (teamEventIds.length > 0) {
    await User.updateMany(
      { savedEvents: { $in: teamEventIds } },
      { $pull: { savedEvents: { $in: teamEventIds.map(id => mongoose.Types.ObjectId.createFromHexString(id)) } } }
    );
  }

  await Notification.deleteMany({ link: `/teams/${team._id}` });
  await Team.findByIdAndDelete(team._id);
}

// POST /api/teams/:id/announce — Send an FCM push to all team members
exports.sendTeamAnnouncement = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const team = await Team.findById(req.params.id).populate('members');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the team leader can send announcements.' });
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Announcement message is required.' });
    }
    if (message.trim().length > 500) {
      return res.status(400).json({ message: 'Announcement must be 500 characters or less.' });
    }

    const notifTitle = `📣 Announcement: ${team.name}`;
    const notifBody = message.trim();

    // Save to DB regardless of FCM status
    const Notification = require('../models/Notification');
    const dbNotifs = team.members.map(m => ({
      userId: m._id,
      title: notifTitle,
      body: notifBody,
      type: 'team_announcement',
      link: `/teams/${team._id}`
    }));
    await Notification.insertMany(dbNotifs);

    const tokens = team.members
      .flatMap(m => (m.fcmTokens || []).filter(t => typeof t === 'string' && t.length > 20));

    console.log(`[Announce] Team: ${team.name}, Members: ${team.members.length}, Valid Tokens: ${tokens.length}`);

    if (tokens.length === 0) {
      return res.json({ message: `Announcement saved! But no team members have valid push tokens. They'll see it in their notification bell.` });
    }

    const payload = {
      notification: {
        title: notifTitle,
        body: notifBody,
      },
      data: {
        title: notifTitle,
        body: notifBody,
        type: 'team_announcement',
        link: `/teams/${team._id}`,
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log(`[Announce] FCM Result — Success: ${response.successCount}, Fail: ${response.failureCount}`);
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`  Token[${idx}] failed:`, resp.error?.code, resp.error?.message);
        }
      });
    }

    apiCache.clear();
    res.json({ message: `Announcement sent to ${response.successCount} member(s)! ${response.failureCount > 0 ? `(${response.failureCount} failed)` : ''}` });
  } catch (err) {
    console.error('[Announce] Error:', err.message);
    res.status(500).json({ message: 'Failed to send announcement' });
  }
};
