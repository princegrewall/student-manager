const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const Library = require('../models/Library');

// DEV ONLY: Bypass authentication middleware for testing
const devProtect = (req, res, next) => {
  console.log('[DEV MODE] Bypassing authentication for development testing');
  // Create mock student/user for development
  req.student = {
    id: '64f0e4e85866a71d1cac10c1', // Some fake ID
    name: 'Development Test User'
  };
  req.user = req.student;
  next();
};

// Use the real or dev middleware based on environment
const authMiddleware = process.env.NODE_ENV === 'development' ? devProtect : protect;

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/library';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
  }
};

// Set up multer upload
const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Error handling middleware for multer
const uploadMiddleware = (req, res, next) => {
  console.log('Processing file upload with Multer');
  console.log('Content-Type:', req.headers['content-type']);
  
  upload.single('document')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds the 10MB limit' });
        }
      }
      return res.status(400).json({ message: err.message || 'Error uploading file' });
    }
    
    console.log('Multer processing complete. Body contains:', Object.keys(req.body));
    next();
  });
};

// Validate fields before file upload
const validateFields = (req, res, next) => {
  console.log('Validating fields. Request body:', req.body);
  
  const { title, author } = req.body;
  
  if (!title || !author) {
    console.error('Validation failed - missing required field:', { 
      titleExists: !!title, 
      authorExists: !!author,
      bodyKeys: Object.keys(req.body)
    });
    return res.status(400).json({ message: 'Title and author are required fields' });
  }
  
  // Fields are valid, proceed
  console.log('Validation successful - required fields present');
  next();
};

// @route   GET /api/library
// @desc    Get all library items, optionally filtered by search term
// @access  Public (anyone can view library items)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const libraryItems = await Library.find(query)
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(libraryItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/library/my-uploads
// @desc    Get library items created by the logged-in user
// @access  Private (teachers and coordinators)
router.get('/my-uploads', protect, authorize('teacher', 'coordinator'), async (req, res) => {
  try {
    console.log(`Fetching library uploads for user ID: ${req.user.id}`);
    
    const libraryItems = await Library.find({ addedBy: req.user.id })
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${libraryItems.length} items created by the current user`);
    
    res.json(libraryItems);
  } catch (err) {
    console.error('Error fetching user library items:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/library/:id
// @desc    Get a specific library item
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const libraryItem = await Library.findById(req.params.id)
      .populate('addedBy', 'name');
    
    if (!libraryItem) {
      return res.status(404).json({ msg: 'Library item not found' });
    }
    
    res.json(libraryItem);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Library item not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/library
// @desc    Create a new library item
// @access  Private - Only teachers and coordinators can create library items
router.post('/', protect, authorize('teacher', 'coordinator'), uploadMiddleware, validateFields, async (req, res) => {
  try {
    console.log('Processing library item creation with data:', req.body);
    console.log('User/student ID:', req.student?.id || 'Not available');
    
    if (req.file) {
      console.log('File received:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }
    
    const { title, author, description, semester } = req.body;
    
    let link = '';
    
    // If file was uploaded, set the link
    if (req.file) {
      // Create a URL-friendly path
      link = `/uploads/library/${req.file.filename}`;
    } else if (req.body.link && req.body.link.trim() !== ' ') {
      // Use provided link if no file was uploaded and link is not just a space
      link = req.body.link;
    } else {
      return res.status(400).json({ message: 'Please provide a file or link' });
    }
    
    // Create new library item
    const libraryItem = new Library({
      title,
      author,
      description: description || '',
      link,
      addedBy: req.student.id,
      semester: semester ? parseInt(semester) : 1 // Ensure semester is stored as a number
    });
    
    console.log('Saving library item to database:', {
      title,
      author,
      description: description || '',
      link,
      addedBy: req.student.id,
      semester: libraryItem.semester
    });
    
    await libraryItem.save();
    
    res.status(201).json(libraryItem);
  } catch (err) {
    console.error('Error creating library item:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/library/:id
// @desc    Update a library item
// @access  Private - Only teachers and coordinators
router.put('/:id', protect, authorize('teacher', 'coordinator'), uploadMiddleware, async (req, res) => {
  try {
    console.log(`Processing update for library item ${req.params.id}`);
    console.log('Request body:', req.body);
    
    if (req.file) {
      console.log('File received for update:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }
    
    // Check if item exists
    const libraryItem = await Library.findById(req.params.id);
    
    if (!libraryItem) {
      return res.status(404).json({ message: 'Library item not found' });
    }
    
    // Check if user is authorized to update this item
    // Allow teachers and coordinators to update any item
    if (req.user.role !== 'teacher' && req.user.role !== 'coordinator' && libraryItem.addedBy.toString() !== req.student.id) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }
    
    // Update fields from request body
    if (req.body.title) libraryItem.title = req.body.title;
    if (req.body.author) libraryItem.author = req.body.author;
    if (req.body.description) libraryItem.description = req.body.description;
    if (req.body.semester) libraryItem.semester = parseInt(req.body.semester);
    
    // If a new file was uploaded, update the link and delete the old file if it was local
    if (req.file) {
      // If old link was a local file, delete it
      if (libraryItem.link && libraryItem.link.startsWith('/uploads')) {
        try {
          const oldFilePath = path.join(__dirname, '../..', libraryItem.link);
          if (fs.existsSync(oldFilePath)) {
            console.log(`Deleting old file: ${oldFilePath}`);
            fs.unlinkSync(oldFilePath);
          }
        } catch (err) {
          console.error(`Failed to delete old file: ${err.message}`);
          // Continue with update even if file deletion fails
        }
      }
      
      // Update link to new file
      libraryItem.link = `/uploads/library/${req.file.filename}`;
    } else if (req.body.link) {
      // Update link if provided in body
      libraryItem.link = req.body.link;
    }
    
    // Save updated item
    await libraryItem.save();
    
    res.json(libraryItem);
  } catch (err) {
    console.error('Error updating library item:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/library/:id
// @desc    Delete a library item
// @access  Private - Teachers can only delete their own items, coordinators can delete any
router.delete('/:id', protect, authorize('teacher', 'coordinator'), async (req, res) => {
  try {
    console.log(`Processing delete for library item ${req.params.id}`);
    
    // Check if item exists
    const libraryItem = await Library.findById(req.params.id);
    
    if (!libraryItem) {
      return res.status(404).json({ message: 'Library item not found' });
    }
    
    // Check if user is authorized to delete this item
    // Only allow teachers to delete their own items
    // Coordinators can delete any item
    if (req.user.role === 'teacher' && libraryItem.addedBy.toString() !== req.user.id) {
      console.log('Authorization failed: Teacher trying to delete another teacher\'s upload');
      console.log(`Item added by: ${libraryItem.addedBy}, Current user: ${req.user.id}`);
      return res.status(403).json({ message: 'Not authorized to delete this item. Teachers can only delete their own uploads.' });
    }
    
    // If item has a local file, delete it
    if (libraryItem.link && libraryItem.link.startsWith('/uploads')) {
      try {
        const filePath = path.join(__dirname, '../..', libraryItem.link);
        if (fs.existsSync(filePath)) {
          console.log(`Deleting file: ${filePath}`);
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(`Failed to delete file: ${err.message}`);
        // Continue with deletion even if file deletion fails
      }
    }
    
    // Delete the item from database using the new method
    await Library.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Library item deleted successfully' });
  } catch (err) {
    console.error('Error deleting library item:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 