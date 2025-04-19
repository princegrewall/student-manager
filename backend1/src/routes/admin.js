const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const Club = require('../models/Club');

// Protect all routes and require coordinator role
router.use(protect);
router.use(authorize('coordinator', 'teacher'));

/**
 * @route   POST /api/admin/club/add-student
 * @desc    Add a student to a club (admin only)
 * @access  Private (coordinators/teachers only)
 */
router.post('/club/add-student', async (req, res) => {
  try {
    const { email, clubType, subclubName } = req.body;

    // Validate input
    if (!email || !clubType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide student email and club type' 
      });
    }

    // Find the student by email
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this email'
      });
    }

    // Check if club type is valid
    const validClubTypes = ['Technical', 'Cultural', 'Sports', 'technical', 'cultural', 'sports'];
    if (!validClubTypes.includes(clubType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid club type'
      });
    }

    // Capitalize club type for consistency
    const normalizedClubType = clubType.charAt(0).toUpperCase() + clubType.slice(1).toLowerCase();

    // Find or create the club
    let club;
    
    // Check if the club exists
    club = await Club.findOne({ type: normalizedClubType });
    
    // If the club doesn't exist, create it
    if (!club) {
      console.log(`Creating club ${normalizedClubType}`);
      club = new Club({
        type: normalizedClubType,
        description: `${normalizedClubType} Club`,
        members: [],
        subclubs: []
      });
      await club.save();
      console.log(`Created club ${normalizedClubType}`);
    }

    // If subclub is specified, check if it exists
    if (subclubName) {
      // Check if the subclub exists using case-insensitive matching
      const subclubExists = club.subclubs.some(subclub => 
        subclub.name.toLowerCase() === subclubName.toLowerCase()
      );

      if (!subclubExists) {
        // If subclub doesn't exist, create it
        console.log(`Creating subclub ${subclubName} in ${normalizedClubType} club`);
        club.subclubs.push({
          name: subclubName,
          description: `${subclubName} subclub`,
          members: []
        });
        await club.save();
        console.log(`Created subclub ${subclubName}`);
      }
    }

    // Add student to club members if not already a member
    if (!club.members.includes(student._id)) {
      club.members.push(student._id);
      await club.save();
    }

    // Update student's joined clubs if not already joined
    if (!student.joinedClubs.includes(normalizedClubType)) {
      student.joinedClubs.push(normalizedClubType);
    }

    // Update student's club memberships
    const membershipIndex = student.clubMemberships.findIndex(
      membership => membership.clubType.toLowerCase() === normalizedClubType.toLowerCase()
    );

    if (membershipIndex === -1) {
      // Create new membership if it doesn't exist
      student.clubMemberships.push({
        clubType: normalizedClubType,
        subclubs: subclubName ? [subclubName] : []
      });
    } else if (subclubName && !student.clubMemberships[membershipIndex].subclubs.includes(subclubName)) {
      // Add subclub to existing membership if not already there
      student.clubMemberships[membershipIndex].subclubs.push(subclubName);
    }

    // If subclub was specified, add student to the subclub members
    if (subclubName) {
      const subclub = club.subclubs.find(sc => 
        sc.name.toLowerCase() === subclubName.toLowerCase()
      );
      
      if (subclub && !subclub.members.includes(student._id)) {
        subclub.members.push(student._id);
        await club.save();
      }
    }

    // Save the student
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student ${student.name} added to ${normalizedClubType} club${subclubName ? ` (${subclubName})` : ''}`,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          joinedClubs: student.joinedClubs,
          clubMemberships: student.clubMemberships
        }
      }
    });
  } catch (error) {
    console.error('Error adding student to club:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding student to club',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/students
 * @desc    Get all students (admin only)
 * @access  Private (coordinators/teachers only)
 */
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find()
      .select('-password')
      .sort({ name: 1 });
    
    return res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error getting students:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving students',
      error: error.message
    });
  }
});

module.exports = router; 