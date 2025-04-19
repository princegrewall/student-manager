const express = require('express');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventsController');
const { protect } = require('../middleware/auth');
const Club = require('../models/Club');
const Event = require('../models/Event');

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for getting events
router.route('/')
  .get(getEvents)
  .post(async (req, res) => {
    try {
      const { title, description, date, clubType, location } = req.body;
      
      // Check if required fields are provided
      if (!title || !description || !date || !clubType) {
        return res.status(400).json({ message: 'Please provide title, description, date and clubType' });
      }
      
      console.log(`Creating event for club type: ${clubType}`);
      
      // Normalize the club type
      const normalizedClubType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
      
      // Validate if the given clubType exists (try both original and normalized)
      const club = await Club.findOne({ 
        $or: [
          { type: clubType },
          { type: normalizedClubType }
        ] 
      });
      
      if (!club) {
        console.log(`Club not found for type: ${clubType} or ${normalizedClubType}`);
        return res.status(404).json({ message: 'Club not found' });
      }
      
      console.log(`Found club: ${club.type} with ${club.members.length} members`);
      
      // Validate date format
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      // Check if the student is a member of the club or is a coordinator
      const isMember = club.members.some(member => member.toString() === req.student.id);
      const isCoordinator = req.student.role === 'coordinator';
      
      // Allow club members or coordinators to create events
      if (!isMember && !isCoordinator) {
        console.log(`User ${req.student.id} is not a member of club ${club.type} and not a coordinator`);
        return res.status(403).json({ message: 'You need to be a member of this club or a coordinator to create events' });
      }
      
      // Create new event (use the actual club type from the database)
      const event = new Event({
        title,
        description,
        date: dateObj,
        clubType: club.type,
        location: location || '',
        organizer: req.student.id
      });
      
      await event.save();
      console.log(`Event created successfully with ID: ${event._id}`);
      
      res.status(201).json(event);
    } catch (err) {
      console.error('Error creating event:', err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

router.route('/:id')
  .get(getEvent)
  .put(updateEvent)
  .delete(deleteEvent);

module.exports = router; 