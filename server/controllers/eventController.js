const Event = require('../models/Event');
const User = require('../models/User');
const Team = require('../models/Team');
const mongoose = require('mongoose');

// In-memory cache for ultra-fast GET responses
const apiCache = require('../utils/cache');

// Helper: validate ObjectId format
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Helper: escape regex special chars to prevent ReDoS
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/events — fetch all personal and public events
exports.getEvents = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { mode, category, city, search, upcoming, page = 1, limit = 20 } = req.query;
    
    // Check in-memory cache first
    const cacheKey = `events_${user._id}_${JSON.stringify(req.query)}`;
    if (apiCache.has(cacheKey)) {
      return res.json(apiCache.get(cacheKey));
    }
    
    const query = { 
      $or: [
        { owner: user._id, team: null },
        { verified: true, owner: { $exists: false } }
      ]
    };

    if (mode) query.mode = mode;
    if (category) query.category = { $in: [category] };
    if (city) query.city = { $regex: escapeRegex(city), $options: 'i' };
    if (upcoming === 'true') query.date = { $gte: new Date() };
    
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { organizer: { $regex: safeSearch, $options: 'i' } },
          { city: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } },
          { mode: { $regex: safeSearch, $options: 'i' } },
          { category: { $regex: safeSearch, $options: 'i' } },
          { prizePool: { $regex: safeSearch, $options: 'i' } },
        ]
      });
    }
    
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const totalCount = await Event.countDocuments(query);
    const events = await Event.find(query).sort({ date: 1 }).skip(skip).limit(pageSize);

    const responseData = {
      events,
      page: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
      totalEvents: totalCount
    };

    // Store in cache for 2 minutes
    apiCache.set(cacheKey, responseData);
    setTimeout(() => apiCache.delete(cacheKey), 2 * 60 * 1000);

    res.json(responseData);
  } catch (err) {
    console.error('getEvents error:', err.message);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

// GET /api/events/:slug — single event
exports.getEventBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Invalid event slug' });
    }

    const cacheKey = `event_${slug}`;
    if (apiCache.has(cacheKey)) {
      return res.json(apiCache.get(cacheKey));
    }

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    apiCache.set(cacheKey, event);
    setTimeout(() => apiCache.delete(cacheKey), 2 * 60 * 1000);

    res.json(event);
  } catch (err) {
    console.error('getEventBySlug error:', err.message);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
};

// POST /api/events — create an event (personal or team)
exports.createEvent = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const { teamId, name, organizer, date, ...restData } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Event name is required' });
    }
    if (!organizer || typeof organizer !== 'string' || organizer.trim().length === 0) {
      return res.status(400).json({ message: 'Organizer is required' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Event date is required' });
    }
    if (isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: 'Invalid event date' });
    }
    if (teamId && !isValidId(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }
    
    const event = new Event({ 
      ...restData,
      name: name.trim(),
      organizer: organizer.trim(),
      date,
      owner: user._id,
      team: teamId || null,
      verified: true
    });
    
    await event.save();
    
    if (teamId) {
      const team = await Team.findById(teamId);
      if (team && team.members.some(id => id.toString() === user._id.toString())) {
        team.events.push(event._id);
        await team.save();
      }
    }
    
    apiCache.clear(); // Clear cache on mutation
    res.status(201).json(event);
  } catch (err) {
    console.error('createEvent error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/events/:id — edit event
exports.updateEvent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (event.owner?.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Prevent overwriting protected fields
    const { _id, owner, __v, ...safeUpdates } = req.body;
    Object.assign(event, safeUpdates);
    await event.save();
    
    apiCache.clear(); // Clear cache on mutation
    res.json(event);
  } catch (err) {
    console.error('updateEvent error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/events/:id — delete event
exports.deleteEvent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

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
    
    // Remove from all users' savedEvents
    await User.updateMany(
      { savedEvents: event._id },
      { $pull: { savedEvents: event._id } }
    );

    // Clean up related notifications
    const Notification = require('../models/Notification');
    await Notification.deleteMany({ link: `/event/${event.slug}` });
    
    await Event.findByIdAndDelete(req.params.id);
    apiCache.clear(); // Clear cache on mutation
    
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('deleteEvent error:', err.message);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};
