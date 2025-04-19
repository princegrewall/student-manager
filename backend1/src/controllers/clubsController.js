const Club = require('../models/Club');
const Student = require('../models/Student');

// @desc    Get all clubs
// @route   GET /api/clubs
// @access  Private
exports.getClubs = async (req, res) => {
  try {
    const clubs = await Club.find().populate({
      path: 'members',
      select: 'name email'
    });

    res.status(200).json({
      success: true,
      count: clubs.length,
      data: clubs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Get single club
// @route   GET /api/clubs/:type
// @access  Private
exports.getClub = async (req, res) => {
  try {
    // Get the club type from request and normalize it
    const requestedType = req.params.type;
    const capitalizedType = requestedType.charAt(0).toUpperCase() + requestedType.slice(1).toLowerCase();
    
    console.log(`Looking for club type: ${requestedType} (normalized: ${capitalizedType})`);
    
    // Try to find the club with exact match or capitalized version
    const club = await Club.findOne({
      $or: [
        { type: requestedType },
        { type: capitalizedType }
      ]
    }).populate({
      path: 'members',
      select: 'name email'
    });

    if (!club) {
      console.log(`No club found with type: ${requestedType}`);
      return res.status(404).json({
        success: false,
        message: `No club with type of ${requestedType}`
      });
    }

    console.log(`Found club: ${club.type} with ${club.members.length} members`);
    res.status(200).json({
      success: true,
      data: club
    });
  } catch (err) {
    console.error('Error getting club:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Create or initialize a new club
// @route   POST /api/clubs
// @access  Private
exports.createClub = async (req, res) => {
  try {
    const { type, description } = req.body;

    // Check if club already exists
    const clubExists = await Club.findOne({ type });

    if (clubExists) {
      return res.status(400).json({
        success: false,
        message: `Club with type ${type} already exists`
      });
    }

    const club = await Club.create({
      type,
      description: description || ''
    });

    res.status(201).json({
      success: true,
      data: club
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Join a club
// @route   PUT /api/clubs/:type/join
// @access  Private
exports.joinClub = async (req, res) => {
  try {
    // Get the club type from request and normalize it
    const requestedType = req.params.type;
    const capitalizedType = requestedType.charAt(0).toUpperCase() + requestedType.slice(1).toLowerCase();
    
    console.log(`Attempting to join club: ${requestedType} (normalized: ${capitalizedType})`);
    
    // Try to find the club with either exact match or capitalized version
    let club = await Club.findOne({
      $or: [
        { type: requestedType },
        { type: capitalizedType }
      ]
    });

    if (!club) {
      // If club doesn't exist yet, create it with the properly capitalized type
      console.log(`Creating new club with type: ${capitalizedType}`);
      club = await Club.create({
        type: capitalizedType
      });
    }

    // Check if student is already a member
    if (club.members.includes(req.student.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this club'
      });
    }

    // Add student to club members
    club.members.push(req.student.id);
    await club.save();

    // Add club to student's joined clubs (use the actual club type from the database)
    await Student.findByIdAndUpdate(req.student.id, {
      $addToSet: { joinedClubs: club.type }
    });

    console.log(`User ${req.student.id} joined club ${club.type}`);
    res.status(200).json({
      success: true,
      data: club
    });
  } catch (err) {
    console.error('Error joining club:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Leave a club
// @route   PUT /api/clubs/:type/leave
// @access  Private
exports.leaveClub = async (req, res) => {
  try {
    const club = await Club.findOne({ type: req.params.type });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: `No club with type of ${req.params.type}`
      });
    }

    // Check if student is a member
    if (!club.members.includes(req.student.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this club'
      });
    }

    // Remove student from club members
    club.members = club.members.filter(
      member => member.toString() !== req.student.id.toString()
    );
    await club.save();

    // Remove club from student's joined clubs
    await Student.findByIdAndUpdate(req.student.id, {
      $pull: { joinedClubs: req.params.type }
    });

    res.status(200).json({
      success: true,
      data: club
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Delete a club completely
// @route   DELETE /api/clubs/:type
// @access  Private - Only coordinators
exports.deleteClub = async (req, res) => {
  try {
    // Normalize the club type
    const requestedType = req.params.type;
    const capitalizedType = requestedType.charAt(0).toUpperCase() + requestedType.slice(1).toLowerCase();
    
    console.log(`Attempting to delete club: ${capitalizedType}`);
    
    // Check if user is a coordinator
    if (req.student.role !== 'coordinator') {
      return res.status(403).json({
        success: false,
        message: 'Only coordinators can delete clubs'
      });
    }
    
    // Try to find the club with exact match or capitalized version
    const club = await Club.findOne({
      $or: [
        { type: requestedType },
        { type: capitalizedType }
      ]
    });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: `No club found with type: ${requestedType}`
      });
    }
    
    // Delete all events associated with this club
    const Event = require('../models/Event');
    await Event.deleteMany({ 
      clubType: { 
        $in: [club.type, club.type.toLowerCase(), club.type.toUpperCase()]
      } 
    });
    console.log(`Deleted events associated with club: ${club.type}`);
    
    // Remove club from all students who have joined it
    await Student.updateMany(
      { joinedClubs: club.type },
      { $pull: { joinedClubs: club.type } }
    );
    console.log(`Removed club ${club.type} from all student profiles`);
    
    // Delete the club itself
    await Club.deleteOne({ _id: club._id });
    console.log(`Deleted club: ${club.type}`);
    
    res.status(200).json({
      success: true,
      message: `Club ${club.type} and all associated data successfully deleted`
    });
  } catch (err) {
    console.error('Error deleting club:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}; 