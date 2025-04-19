const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const Curriculum = require('../models/Curriculum');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/curriculum';
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
  const allowedFileTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX files are allowed.'));
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
  console.log('Processing curriculum file upload with Multer');
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

// Validate required fields
const validateFields = (req, res, next) => {
  console.log('Validating curriculum fields. Request body:', req.body);
  
  const { title, semester, description } = req.body;
  
  if (!title || !semester || !description) {
    console.error('Validation failed - missing required field:', { 
      titleExists: !!title, 
      semesterExists: !!semester,
      descriptionExists: !!description,
      bodyKeys: Object.keys(req.body)
    });
    return res.status(400).json({ message: 'Title, semester, and description are required fields' });
  }
  
  // Fields are valid, proceed
  console.log('Validation successful - required fields present');
  next();
};

// @route   GET /api/curriculum
// @desc    Get all curriculum items, optionally filtered by semester
// @access  Public - Any authenticated user can view curriculum
router.get('/', async (req, res) => {
  try {
    const { semester } = req.query;
    
    let query = {};
    if (semester) {
      query = { semester: parseInt(semester) };
    }
    
    const curriculumItems = await Curriculum.find(query)
      .populate('addedBy', 'name')
      .sort({ semester: 1, createdAt: -1 });
    
    res.json(curriculumItems);
  } catch (err) {
    console.error('Error fetching curriculum:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/curriculum/:id
// @desc    Get a specific curriculum item
// @access  Public - Any authenticated user can view
router.get('/:id', async (req, res) => {
  try {
    const curriculumItem = await Curriculum.findById(req.params.id)
      .populate('addedBy', 'name');
    
    if (!curriculumItem) {
      return res.status(404).json({ message: 'Curriculum item not found' });
    }
    
    res.json(curriculumItem);
  } catch (err) {
    console.error('Error fetching curriculum item:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Curriculum item not found' });
    }
    
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/curriculum
// @desc    Create a new curriculum item
// @access  Private - Only teachers and coordinators can create curriculum
router.post('/', protect, authorize('teacher', 'coordinator'), uploadMiddleware, validateFields, async (req, res) => {
  try {
    console.log('Processing curriculum item creation with data:', req.body);
    console.log('User/student ID:', req.student?.id || 'Not available');
    
    if (req.file) {
      console.log('File received:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }
    
    const { title, semester, description } = req.body;
    
    let fileLink = '';
    
    // If file was uploaded, set the link
    if (req.file) {
      // Create a URL-friendly path
      fileLink = `/uploads/curriculum/${req.file.filename}`;
    } else if (req.body.fileLink && req.body.fileLink.trim() !== ' ') {
      // Use provided link if no file was uploaded and link is not just a space
      fileLink = req.body.fileLink;
    } else {
      return res.status(400).json({ message: 'Please provide a file or link' });
    }
    
    // Create new curriculum item
    const curriculumItem = new Curriculum({
      title,
      semester: parseInt(semester),
      description,
      fileLink,
      addedBy: req.student.id
    });
    
    console.log('Saving curriculum item to database:', {
      title,
      semester: parseInt(semester),
      description,
      fileLink,
      addedBy: req.student.id
    });
    
    await curriculumItem.save();
    
    res.status(201).json(curriculumItem);
  } catch (err) {
    console.error('Error creating curriculum item:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/curriculum/:id
// @desc    Update a curriculum item
// @access  Private - Only teachers and coordinators
router.put('/:id', protect, authorize('teacher', 'coordinator'), uploadMiddleware, async (req, res) => {
  try {
    console.log(`Processing update for curriculum item ${req.params.id}`);
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
    const curriculumItem = await Curriculum.findById(req.params.id);
    
    if (!curriculumItem) {
      return res.status(404).json({ message: 'Curriculum item not found' });
    }
    
    // Check if user is authorized to update this item
    // Allow teachers and coordinators to update any item
    if (req.user.role !== 'teacher' && req.user.role !== 'coordinator' && curriculumItem.addedBy.toString() !== req.student.id) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }
    
    // Update fields from request body
    if (req.body.title) curriculumItem.title = req.body.title;
    if (req.body.semester) curriculumItem.semester = parseInt(req.body.semester);
    if (req.body.description) curriculumItem.description = req.body.description;
    
    // If a new file was uploaded, update the link and delete the old file if it was local
    if (req.file) {
      // If old link was a local file, delete it
      if (curriculumItem.fileLink && curriculumItem.fileLink.startsWith('/uploads')) {
        try {
          const oldFilePath = path.join(__dirname, '../..', curriculumItem.fileLink);
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
      curriculumItem.fileLink = `/uploads/curriculum/${req.file.filename}`;
    } else if (req.body.fileLink) {
      // Update link if provided in body
      curriculumItem.fileLink = req.body.fileLink;
    }
    
    // Save updated item
    await curriculumItem.save();
    
    res.json(curriculumItem);
  } catch (err) {
    console.error('Error updating curriculum item:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/curriculum/:id
// @desc    Delete a curriculum item
// @access  Private - Only teachers and coordinators
router.delete('/:id', protect, authorize('teacher', 'coordinator'), async (req, res) => {
  try {
    console.log(`Processing delete for curriculum item ${req.params.id}`);
    
    // Check if item exists
    const curriculumItem = await Curriculum.findById(req.params.id);
    
    if (!curriculumItem) {
      return res.status(404).json({ message: 'Curriculum item not found' });
    }
    
    // Check if user is authorized to delete this item
    // Allow teachers and coordinators to delete any item
    if (req.user.role !== 'teacher' && req.user.role !== 'coordinator' && curriculumItem.addedBy.toString() !== req.student.id) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }
    
    // If item has a local file, delete it
    if (curriculumItem.fileLink && curriculumItem.fileLink.startsWith('/uploads')) {
      try {
        const filePath = path.join(__dirname, '../..', curriculumItem.fileLink);
        if (fs.existsSync(filePath)) {
          console.log(`Deleting file: ${filePath}`);
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(`Failed to delete file: ${err.message}`);
        // Continue with deletion even if file deletion fails
      }
    }
    
    // Delete the item from database
    await curriculumItem.remove();
    
    res.json({ message: 'Curriculum item deleted successfully' });
  } catch (err) {
    console.error('Error deleting curriculum item:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 