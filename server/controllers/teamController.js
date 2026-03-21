const Team = require('../models/Team');
const User = require('../models/User');
const admin = require('../config/firebaseAdmin');

// POST /api/teams — create a team
exports.createTeam = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, description, color } = req.body;
    const team = new Team({
      name,
      description: description || '',
      color: color || '#ff4d4d',
      owner: user._id,
      members: [user._id],
    });
    await team.save();

    res.status(201).json(team);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/teams/join — join a team by code
exports.joinTeam = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { code } = req.body;
    const team = await Team.findOne({ code: code.toUpperCase() });
    if (!team) return res.status(404).json({ message: 'Team not found. Check the code and try again.' });

    if (team.members.includes(user._id)) {
      return res.status(400).json({ message: 'You are already a member of this team.' });
    }

    team.members.push(user._id);
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('members', 'displayName email photoURL')
      .populate('events')
      .populate('owner', 'displayName email');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teams — get all teams the user belongs to
exports.getMyTeams = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const teams = await Team.find({ members: user._id })
      .populate('members', 'displayName email photoURL')
      .populate('events')
      .populate('owner', 'displayName email')
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teams/:id — get single team
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'displayName email photoURL')
      .populate('events')
      .populate('owner', 'displayName email');
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/teams/:id/add-event — add event to team schedule
exports.addEventToTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!team.members.includes(user._id)) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    const { eventId } = req.body;
    if (team.events.includes(eventId)) {
      return res.json({ message: 'Event already in team schedule' });
    }

    team.events.push(eventId);
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('events')
      .populate('members', 'displayName email photoURL')
      .populate('owner', 'displayName email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/teams/:id/remove-event — remove event from team schedule
exports.removeEventFromTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!team.members.includes(user._id)) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    const { eventId } = req.body;
    team.events = team.events.filter((id) => id.toString() !== eventId);
    await team.save();

    res.json({ message: 'Event removed from team schedule' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/teams/:id — update team details (owner only)
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (team.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the team owner can update details' });
    }

    const { name, description, color } = req.body;
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (color) team.color = color;
    await team.save();

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/teams/:id/leave — leave a team
exports.leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findOne({ firebaseUID: req.user.uid });

    if (team.owner.toString() === user._id.toString()) {
      // Owner leaves → full cascade delete
      await cascadeDeleteTeam(team);
      return res.json({ message: 'Team dissolved. All events, notifications, and member links cleaned up.' });
    }

    // Regular member leaves
    team.members = team.members.filter((id) => id.toString() !== user._id.toString());
    await team.save();
    res.json({ message: 'Left team' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/teams/:id — delete team entirely (owner only)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (team.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the team owner can delete the team.' });
    }

    await cascadeDeleteTeam(team);
    res.json({ message: 'Team deleted. All events, notifications, and member links cleaned up.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper: fully cascade-delete a team and all associated data
async function cascadeDeleteTeam(team) {
  const Event = require('../models/Event');
  const Notification = require('../models/Notification');

  // 1. Get all event IDs belonging to this team
  const teamEventIds = team.events.map(id => id.toString());

  // 2. Delete all events tied to this team from the Event collection
  await Event.deleteMany({ _id: { $in: teamEventIds } });
  // Also delete any events that reference this team via `team` field (safety net)
  await Event.deleteMany({ team: team._id });

  // 3. Remove those event IDs from every user's savedEvents
  if (teamEventIds.length > 0) {
    await User.updateMany(
      { savedEvents: { $in: teamEventIds } },
      { $pull: { savedEvents: { $in: teamEventIds.map(id => require('mongoose').Types.ObjectId.createFromHexString(id)) } } }
    );
  }

  // 4. Delete all notifications linked to this team
  await Notification.deleteMany({ link: `/teams/${team._id}` });

  // 5. Delete the team itself
  await Team.findByIdAndDelete(team._id);
}

// POST /api/teams/:id/announce — Send an FCM push to all team members
exports.sendTeamAnnouncement = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const team = await Team.findById(req.params.id).populate('members');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the team leader can send announcements.' });
    }

    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Announcement message is required.' });

    const notifTitle = `📣 Announcement: ${team.name}`;
    const notifBody = message;

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
      .filter(m => m.fcmToken && typeof m.fcmToken === 'string' && m.fcmToken.length > 20)
      .map(m => m.fcmToken);

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

    res.json({ message: `Announcement sent to ${response.successCount} member(s)! ${response.failureCount > 0 ? `(${response.failureCount} failed)` : ''}` });
  } catch (err) {
    console.error('[Announce] Error:', err);
    res.status(500).json({ message: err.message });
  }
};
