const Student = require('../models/Student');

// @desc    Register student
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if student already exists
    const studentExists = await Student.findOne({ email });

    if (studentExists) {
      return res.status(400).json({
        success: false,
        message: 'Student with that email already exists'
      });
    }

    // Create student
    const student = await Student.create({
      name,
      email,
      password,
      role
    });

    sendTokenResponse(student, 201, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Login student
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    console.log('Login attempt with:', { email, role: role || 'not specified' });

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for student
    const student = await Student.findOne({ email }).select('+password');

    if (!student) {
      console.log(`Login failed: User not found with email ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log(`User found with role: ${student.role}`);

    // Check if password matches
    const isMatch = await student.matchPassword(password);

    if (!isMatch) {
      console.log(`Login failed: Password does not match for ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // If role is provided, check if user has the role
    if (role && student.role !== role) {
      console.log(`Login failed: Role mismatch - User has role '${student.role}' but tried to login as '${role}'`);
      return res.status(401).json({
        success: false,
        message: `Account exists but not as a ${role}. Please login with the correct role.`
      });
    }

    console.log(`Login successful for ${email} with role ${student.role}`);
    sendTokenResponse(student, 200, res);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Get current logged in student
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    
    console.log(`Returning profile data for ${student.name} with role ${student.role}`);

    res.status(200).json({
      success: true,
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        joinedClubs: student.joinedClubs,
        clubMemberships: student.clubMemberships,
        createdAt: student.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (student, statusCode, res) => {
  // Create token
  const token = student.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token
  });
}; 