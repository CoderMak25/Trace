const Event = require('../models/Event');

// GET /api/events — fetch all verified events with filters
exports.getEvents = async (req, res) => {
  try {
    const { mode, category, city, search, upcoming } = req.query;
    const query = { verified: true };

    if (mode) query.mode = mode;
    if (category) query.category = { $in: [category] };
    if (city) query.city = { $regex: city, $options: 'i' };
    if (upcoming === 'true') query.date = { $gte: new Date() };
    
    let events;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    events = await Event.find(query).sort({ date: 1 });
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

// POST /api/events — admin create
exports.createEvent = async (req, res) => {
  try {
    const event = new Event({ ...req.body, verified: true });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/events/:id — admin edit
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/events/:id — admin delete
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
