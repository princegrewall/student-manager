const Event = require('../models/Event');
const Club = require('../models/Club');

// @desc    Get all events, optionally filtered by club type
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res) => {
  try {
    const { clubType } = req.query;
    let query = {};
    
    // If club type is provided, search for events with that club type
    if (clubType) {
      console.log(`Fetching events for club type: ${clubType}`);
      
      // Normalize the club type
      const normalizedType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
      
      // Check if the club exists
      const club = await Club.findOne({
        $or: [
          { type: clubType },
          { type: normalizedType }
        ]
      });
      
      if (club) {
        console.log(`Found club: ${club.type}`);
        
        // Search case-insensitively for events with the club type
        query = { 
          clubType: { $regex: new RegExp(club.type, 'i') }
        };
      } else {
        console.log(`No club found for type: ${clubType}`);
        
        // Use the provided type to search, allowing for case variations
        query = { 
          clubType: { $regex: new RegExp(clubType, 'i') }
        };
      }
    }
    
    const events = await Event.find(query).sort({ date: 1 });
    console.log(`Found ${events.length} events${clubType ? ` for club type ${clubType}` : ''}`);
    
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a specific event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if the user is the one who created the event
    if (event.organizer.toString() !== req.student.id) {
      return res.status(401).json({ message: 'Not authorized to update this event' });
    }
    
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json(updatedEvent);
  } catch (err) {
    console.error('Error updating event:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if the user is the one who created the event or is a coordinator
    const isOrganizer = event.organizer.toString() === req.student.id;
    const isCoordinator = req.student.role === 'coordinator';
    
    if (!isOrganizer && !isCoordinator) {
      return res.status(401).json({ 
        message: 'Not authorized to delete this event. You must be the event organizer or a coordinator.' 
      });
    }
    
    // Use deleteOne instead of remove to avoid Mongoose deprecation issues
    await Event.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Error deleting event:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Note: The POST method is handled directly in the routes file
// since it requires special processing to validate club membership 