const Team = require('../models/Team');
const User = require('../models/User');

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
      // If owner leaves, delete the team
      await Team.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Team deleted (owner left)' });
    }

    team.members = team.members.filter((id) => id.toString() !== user._id.toString());
    await team.save();
    res.json({ message: 'Left team' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
