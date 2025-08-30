const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Connect to Database
console.log('Attempting to connect to MongoDB Atlas...');
connectDB().catch((err) => {
  console.log('\n=========== DATABASE CONNECTION ERROR ===========');
  console.log('The application failed to connect to MongoDB Atlas');
  console.log('Attempting to connect to local MongoDB...');
  
  // If connecting to Atlas fails, try connecting to local MongoDB
  const mongoose = require('mongoose');
  mongoose.connect('mongodb://localhost:27017/college')
    .then(() => {
      console.log('Connected to local MongoDB successfully');
      console.log('========================================\n');
    })
    .catch(localErr => {
      console.error('Failed to connect to local MongoDB:', localErr.message);
      console.log('\n=========== DEVELOPMENT MODE ===========');
      console.log('Running the application without a real database.');
      console.log('All data will be lost when the server restarts.');
      console.log('This is only for development/testing purposes.');
      console.log('==========================================\n');
      
      // Continue running the app even without a database for development
      global.isDevMode = true;
      
      // Setup mock data containers
      global.mockDB = {
        students: [],
        clubs: [
          { type: 'tech', name: 'Technology Club', description: 'For tech enthusiasts', members: [] },
          { type: 'art', name: 'Art Club', description: 'For art lovers', members: [] },
          { type: 'sports', name: 'Sports Club', description: 'For sports enthusiasts', members: [] }
        ],
        events: [],
        curriculum: [],
        library: [],
        subjects: [],
        attendance: []
      };
    });
});

// Initialize Express
const app = express();

// Middleware
app.use(express.json());

// Configure CORS
const corsOptions = {
  origin: 'https://student-manager-yljd.vercel.app', // Replace with your frontend's live link
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));

// Set up static directory for file uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Mock database middleware for development mode
app.use((req, res, next) => {
  if (global.isDevMode) {
    // Attach the mock database to the request
    req.mockDB = global.mockDB;
    
    // For auth routes, automatically "authenticate" in dev mode
    if (req.path.startsWith('/api/auth')) {
      if (req.path === '/api/auth/register' && req.method === 'POST') {
        const newUser = req.body;
        newUser._id = Date.now().toString();
        global.mockDB.students.push(newUser);
        return res.json({ 
          token: 'mock-token-for-development',
          student: newUser
        });
      }
      
      if (req.path === '/api/auth/login' && req.method === 'POST') {
        // In dev mode, any login credentials will work
        return res.json({
          token: 'mock-token-for-development',
          student: {
            _id: 'mock-user-id',
            name: 'Development User',
            email: req.body.email || 'dev@example.com'
          }
        });
      }
      
      if (req.path === '/api/auth/me') {
        return res.json({
          _id: 'mock-user-id',
          name: 'Development User',
          email: 'dev@example.com'
        });
      }
    }
    
    // For mock data operations on other routes
    console.log('Development mode: Mocking database operation for', req.method, req.path);
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clubs', require('./routes/clubs'));
app.use('/api/events', require('./routes/events'));
app.use('/api/curriculum', require('./routes/curriculum'));
app.use('/api/library', require('./routes/library'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/admin', require('./routes/admin'));

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to College Management System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle Multer errors
  if (err.name === 'MulterError') {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          message: 'File size is too large. Maximum size is 10MB.' 
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          message: 'Unexpected field name for file upload. The field should be named "document".' 
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          message: 'Too many files uploaded. Only one file is allowed.' 
        });
      default:
        return res.status(400).json({ 
          message: `File upload error: ${err.code}` 
        });
    }
  }
  
  // Handle file type validation errors from multer fileFilter
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ message: err.message });
  }
  
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  
  res.status(500).json({
    message: err.message || 'Something went wrong on the server',
  });
});

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});