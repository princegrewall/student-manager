const express = require('express');
const {
  getClubs,
  getClub,
  createClub,
  joinClub,
  leaveClub,
  deleteClub
} = require('../controllers/clubsController');
const { protect } = require('../middleware/auth');
const Club = require('../models/Club');
const Student = require('../models/Student');

const router = express.Router();

// Protect all routes
router.use(protect);

// Middleware to ensure clubs exist
const ensureClubExists = async (req, res, next) => {
  try {
    const requestedType = req.params.type;
    
    // Skip if no type provided
    if (!requestedType) return next();
    
    // Normalize the club type
    const normalizedType = requestedType.charAt(0).toUpperCase() + requestedType.slice(1).toLowerCase();
    console.log(`Checking if club exists: ${requestedType} (normalized: ${normalizedType})`);
    
    // Check if club exists (with either form)
    const club = await Club.findOne({
      $or: [
        { type: requestedType },
        { type: normalizedType }
      ]
    });
    
    if (!club) {
      console.log(`Club not found, creating club: ${normalizedType}`);
      
      // Create the club automatically
      try {
        const newClub = await Club.create({
          type: normalizedType,
          description: `${normalizedType} Club - Automatically created`
        });
        
        console.log(`Club created: ${newClub.type}`);
        req.club = newClub;
        return next();
      } catch (createError) {
        console.error(`Error creating club: ${createError.message}`);
        if (createError.code === 11000) {
          // Duplicate key error - another simultaneous request might have created it
          console.log(`Club ${normalizedType} might have been created by another request`);
          return next();
        }
        return res.status(500).json({ message: 'Error creating club' });
      }
    }
    
    console.log(`Club exists: ${club.type} with ${club.members.length} members`);
    req.club = club;
    next();
  } catch (err) {
    console.error(`Error in ensureClubExists middleware: ${err.message}`);
    next(err);
  }
};

// Routes
router.route('/')
  .get(getClubs)
  .post(createClub);

router.route('/:type')
  .get(ensureClubExists, getClub)
  .delete(ensureClubExists, deleteClub);

router.route('/:type/join')
  .put(ensureClubExists, joinClub);

router.route('/:type/leave')
  .put(ensureClubExists, leaveClub);

// @route   GET /api/clubs/:type/members
// @desc    Get all members of a specific club
// @access  Private
router.get('/:type/members', ensureClubExists, async (req, res) => {
  try {
    // If we have a club from the middleware, use it
    if (req.club) {
      console.log(`Found club from middleware: ${req.club.type}`);
      
      // Find all students that have joined this club
      const members = await Student.find({ 
        joinedClubs: { $regex: new RegExp(req.club.type, 'i') }
      }).select('-password');
      
      console.log(`Found ${members.length} members for club ${req.club.type}`);
      res.json(members);
      return;
    }
    
    // Get the club type from the URL parameter
    let clubType = req.params.type;
    
    // Try with first letter capitalized to match enum
    const capitalizedType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();
    
    console.log(`Looking for club with types: ${clubType} or ${capitalizedType}`);
    
    // First, try to find the club with exact match
    let club = await Club.findOne({ 
      $or: [
        { type: clubType },
        { type: capitalizedType }
      ]
    });
    
    // If still not found, return 404
    if (!club) {
      console.log(`Club not found: ${clubType}`);
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Find all students that have joined this club
    // Try with both the original and capitalized type
    const members = await Student.find({ 
      $or: [
        { joinedClubs: clubType },
        { joinedClubs: capitalizedType },
        { joinedClubs: club.type }
      ]
    }).select('-password');
    
    console.log(`Found ${members.length} members for club ${club.type}`);
    res.json(members);
  } catch (err) {
    console.error('Error getting club members:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/clubs/:type/add-student
// @desc    Add a student to a specific club by email
// @access  Private
router.post('/:type/add-student', ensureClubExists, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Student email is required' });
    }
    
    // Find the student by email
    const student = await Student.findOne({ email });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found with this email' });
    }
    
    // Get club from middleware
    const club = req.club;
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Check if student is already a member
    if (club.members.includes(student._id)) {
      return res.status(400).json({ message: 'Student is already a member of this club' });
    }
    
    // Add student to club members
    club.members.push(student._id);
    await club.save();
    
    // Add club to student's joined clubs
    if (!student.joinedClubs.includes(club.type)) {
      student.joinedClubs.push(club.type);
      await student.save();
    }
    
    console.log(`Student ${student.name} (${student.email}) added to club ${club.type}`);
    
    res.status(200).json({
      success: true,
      message: `Student ${student.name} added to ${club.type} club`,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email
        },
        club: {
          type: club.type,
          memberCount: club.members.length
        }
      }
    });
    
  } catch (err) {
    console.error(`Error adding student to club: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/clubs/:type/is-member
// @desc    Check if the current user is a member of a specific club
// @access  Private
router.get('/:type/is-member', ensureClubExists, async (req, res) => {
  try {
    // Get club from middleware
    const club = req.club;
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Check if the current user is a member of the club
    const isMember = club.members.some(member => member.toString() === req.student.id);
    
    console.log(`User ${req.student.id} is ${isMember ? '' : 'not '}a member of club ${club.type}`);
    
    res.status(200).json({
      success: true,
      isMember,
      clubType: club.type
    });
    
  } catch (err) {
    console.error(`Error checking club membership: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/clubs/:type/subclubs
// @desc    Create a new subclub for a specific club type
// @access  Private
router.post('/:type/subclubs', ensureClubExists, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Subclub name is required' });
    }
    
    const club = req.club;
    
    // Check if subclub with this name already exists
    const subclubExists = club.subclubs.find(s => 
      s.name.toLowerCase() === name.toLowerCase()
    );
    
    if (subclubExists) {
      return res.status(400).json({ 
        message: `Subclub with name '${name}' already exists in ${club.type} club` 
      });
    }
    
    // Create a new subclub
    club.subclubs.push({
      name,
      description: description || '',
      members: [] // Initially empty
    });
    
    await club.save();
    
    const newSubclub = club.subclubs[club.subclubs.length - 1];
    
    console.log(`Created new subclub '${name}' for ${club.type} club`);
    
    res.status(201).json({
      success: true,
      data: newSubclub
    });
    
  } catch (err) {
    console.error(`Error creating subclub: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/clubs/:type/subclubs
// @desc    Get all subclubs for a specific club type
// @access  Private
router.get('/:type/subclubs', ensureClubExists, async (req, res) => {
  try {
    const club = req.club;
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    res.status(200).json({
      success: true,
      count: club.subclubs.length,
      data: club.subclubs
    });
    
  } catch (err) {
    console.error(`Error fetching subclubs: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/clubs/:type/subclubs/:subclubName/join
// @desc    Join a specific subclub 
// @access  Private
router.put('/:type/subclubs/:subclubName/join', ensureClubExists, async (req, res) => {
  try {
    const { type, subclubName } = req.params;
    const club = req.club;
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Find the subclub by name (case insensitive)
    const subclub = club.subclubs.find(s => 
      s.name.toLowerCase() === subclubName.toLowerCase()
    );
    
    if (!subclub) {
      return res.status(404).json({ 
        message: `Subclub '${subclubName}' not found in ${club.type} club` 
      });
    }
    
    // Check if student is already a member of this subclub
    const isMember = subclub.members.some(memberId => 
      memberId.toString() === req.student.id
    );
    
    if (isMember) {
      return res.status(400).json({ 
        message: `You are already a member of the '${subclub.name}' subclub` 
      });
    }
    
    // First make sure the student is a member of the parent club
    if (!club.members.includes(req.student.id)) {
      // Add student to club members
      club.members.push(req.student.id);
      
      // Add club to student's joined clubs
      await Student.findByIdAndUpdate(req.student.id, {
        $addToSet: { joinedClubs: club.type }
      });
      
      console.log(`User ${req.student.id} automatically joined parent club ${club.type}`);
    }
    
    // Add student to subclub members
    subclub.members.push(req.student.id);
    
    // Now update the student's clubMemberships
    const student = await Student.findById(req.student.id);
    
    // Check if student already has a record for this club type
    const membershipIndex = student.clubMemberships.findIndex(m => 
      m.clubType === club.type
    );
    
    if (membershipIndex >= 0) {
      // Add the subclub to existing record if not already there
      if (!student.clubMemberships[membershipIndex].subclubs.includes(subclub.name)) {
        student.clubMemberships[membershipIndex].subclubs.push(subclub.name);
      }
    } else {
      // Create a new membership record
      student.clubMemberships.push({
        clubType: club.type,
        subclubs: [subclub.name]
      });
    }
    
    await Promise.all([club.save(), student.save()]);
    
    console.log(`User ${req.student.id} joined subclub '${subclub.name}' in ${club.type} club`);
    
    res.status(200).json({
      success: true,
      message: `Successfully joined '${subclub.name}' subclub`,
      data: subclub
    });
    
  } catch (err) {
    console.error(`Error joining subclub: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/clubs/:type/subclubs/:subclubName/members
// @desc    Get all members of a specific subclub
// @access  Private
router.get('/:type/subclubs/:subclubName/members', ensureClubExists, async (req, res) => {
  try {
    const { type, subclubName } = req.params;
    const club = req.club;
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Find the subclub by name (case insensitive)
    const subclub = club.subclubs.find(s => 
      s.name.toLowerCase() === subclubName.toLowerCase()
    );
    
    if (!subclub) {
      return res.status(404).json({ 
        message: `Subclub '${subclubName}' not found in ${club.type} club` 
      });
    }
    
    // Get all members of this subclub
    const members = await Student.find({
      _id: { $in: subclub.members }
    }).select('-password');
    
    console.log(`Found ${members.length} members for subclub '${subclub.name}' in ${club.type} club`);
    
    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
    
  } catch (err) {
    console.error(`Error fetching subclub members: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/clubs/:type/subclubs/:subclubName/is-member
// @desc    Check if current user is a member of a specific subclub
// @access  Private
router.get('/:type/subclubs/:subclubName/is-member', ensureClubExists, async (req, res) => {
  try {
    const { type, subclubName } = req.params;
    const club = req.club;
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Find the subclub by name (case insensitive)
    const subclub = club.subclubs.find(s => 
      s.name.toLowerCase() === subclubName.toLowerCase()
    );
    
    if (!subclub) {
      return res.status(404).json({ 
        message: `Subclub '${subclubName}' not found in ${club.type} club` 
      });
    }
    
    // Check if student is a member of this subclub
    const isMember = subclub.members.some(memberId => 
      memberId.toString() === req.student.id
    );
    
    console.log(`User ${req.student.id} is ${isMember ? '' : 'not '}a member of subclub '${subclub.name}'`);
    
    res.status(200).json({
      success: true,
      isMember,
      clubType: club.type,
      subclubName: subclub.name
    });
    
  } catch (err) {
    console.error(`Error checking subclub membership: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/clubs/:type/subclubs/:subclubName
// @desc    Delete a specific subclub
// @access  Private
router.delete('/:type/subclubs/:subclubName', ensureClubExists, async (req, res) => {
  try {
    const { type, subclubName } = req.params;
    const club = req.club;
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Find the subclub index by name (case insensitive)
    const subclubIndex = club.subclubs.findIndex(s => 
      s.name.toLowerCase() === subclubName.toLowerCase()
    );
    
    if (subclubIndex === -1) {
      return res.status(404).json({ 
        message: `Subclub '${subclubName}' not found in ${club.type} club` 
      });
    }
    
    // Check if the current user is a coordinator
    const student = await Student.findById(req.student.id);
    if (student.role !== 'coordinator') {
      return res.status(403).json({ 
        message: 'Only coordinators can delete subclubs' 
      });
    }
    
    // Remove the subclub by splicing the array
    club.subclubs.splice(subclubIndex, 1);
    await club.save();
    
    console.log(`Subclub '${subclubName}' deleted from ${club.type} club by user ${req.student.id}`);
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted '${subclubName}' subclub`
    });
    
  } catch (err) {
    console.error(`Error deleting subclub: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/clubs/:type/subclubs/:subclubName/members/:studentId
// @desc    Remove a student from a specific subclub (coordinators only)
// @access  Private
router.delete('/:type/subclubs/:subclubName/members/:studentId', ensureClubExists, async (req, res) => {
  try {
    const { type, subclubName, studentId } = req.params;
    const club = req.club;
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Find the subclub by name (case insensitive)
    const subclub = club.subclubs.find(s => 
      s.name.toLowerCase() === subclubName.toLowerCase()
    );
    
    if (!subclub) {
      return res.status(404).json({ 
        message: `Subclub '${subclubName}' not found in ${club.type} club` 
      });
    }
    
    // Check if the current user is a coordinator
    const currentUser = await Student.findById(req.student.id);
    if (currentUser.role !== 'coordinator') {
      return res.status(403).json({ 
        message: 'Only coordinators can remove members from subclubs' 
      });
    }
    
    // Check if the student exists
    const studentToRemove = await Student.findById(studentId);
    if (!studentToRemove) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if student is a member of this subclub
    const memberIndex = subclub.members.findIndex(memberId => 
      memberId.toString() === studentId
    );
    
    if (memberIndex === -1) {
      return res.status(400).json({ 
        message: `Student is not a member of the '${subclub.name}' subclub` 
      });
    }
    
    // Remove student from subclub members
    subclub.members.splice(memberIndex, 1);
    
    // Update the student's clubMemberships to remove this subclub
    const membershipIndex = studentToRemove.clubMemberships.findIndex(m => 
      m.clubType === club.type
    );
    
    if (membershipIndex >= 0) {
      const subclubIndex = studentToRemove.clubMemberships[membershipIndex].subclubs.indexOf(subclub.name);
      if (subclubIndex >= 0) {
        studentToRemove.clubMemberships[membershipIndex].subclubs.splice(subclubIndex, 1);
        
        // If no more subclubs in this club type, remove the entire membership entry
        if (studentToRemove.clubMemberships[membershipIndex].subclubs.length === 0) {
          studentToRemove.clubMemberships.splice(membershipIndex, 1);
        }
      }
    }
    
    await Promise.all([club.save(), studentToRemove.save()]);
    
    console.log(`Coordinator ${req.student.id} removed student ${studentId} from subclub '${subclub.name}' in ${club.type} club`);
    
    res.status(200).json({
      success: true,
      message: `Successfully removed student from '${subclub.name}' subclub`,
      data: {
        studentId,
        subclubName: subclub.name,
        clubType: club.type
      }
    });
    
  } catch (err) {
    console.error(`Error removing student from subclub: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;