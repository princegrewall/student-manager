const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Protect routes - checks if user is authenticated
exports.protect = async (req, res, next) => {
  console.log('Authentication middleware called');
  console.log('Headers:', JSON.stringify(req.headers));
  
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Bearer token found:', token ? `${token.substring(0, 10)}...` : 'none');
  } else {
    console.log('No Bearer token in Authorization header');
  }

  // Check if token exists
  if (!token) {
    console.log('Authentication failed: No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified. User ID:', decoded.id);

    // Get user from token
    req.user = await Student.findById(decoded.id).select('-password');
    
    if (!req.user) {
      console.log('Authentication failed: User not found in database');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // For compatibility with existing code that uses req.student
    req.student = req.user;
    
    console.log('Authentication successful for user:', req.user.name);
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
}; 

// Authorize certain roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    console.log(`Checking user role: ${req.user.role}`);
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    console.log('Authorization successful for role:', req.user.role);
    next();
  };
}; 