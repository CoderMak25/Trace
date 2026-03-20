const Event = require('../models/Event');

const User = require('../models/User');
const Team = require('../models/Team');

// GET /api/events — fetch all personal and public events
exports.getEvents = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    const { mode, category, city, search, upcoming } = req.query;
    
    // By default, fetch events owned by the user (and not attached to a team)
    const query = { 
      $or: [
        { owner: user?._id, team: null },
        { verified: true, owner: { $exists: false } } // Seeded public events
      ]
    };

    if (mode) query.mode = mode;
    if (category) query.category = { $in: [category] };
    if (city) query.city = { $regex: city, $options: 'i' };
    if (upcoming === 'true') query.date = { $gte: new Date() };
    
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { organizer: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { mode: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { prizePool: { $regex: search, $options: 'i' } },
        ]
      });
    }
    
    const events = await Event.find(query).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/events/:slug — single event
exports.getEventBySlug = async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/events — create an event (personal or team)
exports.createEvent = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    // Extract teamId if passed from frontend
    const { teamId, ...eventData } = req.body;
    
    const event = new Event({ 
      ...eventData, 
      owner: user._id,
      team: teamId || null,
      verified: true // Personal/team events are inherently verified
    });
    
    await event.save();
    
    // If it's a team event, add it to team's array
    if (teamId) {
      const team = await Team.findById(teamId);
      if (team && team.members.includes(user._id)) {
        team.events.push(event._id);
        await team.save();
      }
    }
    
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/events/:id — edit event
exports.updateEvent = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    const event = await Event.findOne({ _id: req.params.id });
    
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (event.owner?.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/events/:id — delete event
exports.deleteEvent = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    const event = await Event.findById(req.params.id);
    
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (event.owner?.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Remove from team if applicable
    if (event.team) {
      const team = await Team.findById(event.team);
      if (team) {
        team.events = team.events.filter(e => e.toString() !== event._id.toString());
        await team.save();
      }
    }
    
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
