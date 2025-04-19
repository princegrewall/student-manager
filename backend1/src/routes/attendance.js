const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');

// Protect all routes
router.use(protect);

// @route   GET /api/attendance/subjects
// @desc    Get all subjects for the authenticated student
// @access  Private
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({ student: req.user.id });
    res.json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/attendance/subjects
// @desc    Create a new subject
// @access  Private
router.post('/subjects', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Subject name is required' });
    }
    
    // Check if subject already exists for this student
    const existingSubject = await Subject.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      student: req.user.id 
    });
    
    if (existingSubject) {
      return res.status(400).json({ message: 'Subject already exists' });
    }
    
    const subject = new Subject({
      name,
      student: req.user.id
    });
    
    await subject.save();
    
    res.status(201).json(subject);
  } catch (err) {
    console.error('Error creating subject:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/attendance/subjects/:id
// @desc    Delete a subject
// @access  Private
router.delete('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Check if subject belongs to student
    if (subject.student.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Delete all attendance records for this subject
    await Attendance.deleteMany({ subject: subject._id });
    
    // Delete the subject
    await Subject.findByIdAndDelete(subject._id);
    
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/attendance/subjects/:id/records
// @desc    Get all attendance records for a subject
// @access  Private
router.get('/subjects/:id/records', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Check if subject belongs to student
    if (subject.student.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const records = await Attendance.find({ 
      subject: subject._id,
      student: req.user.id
    }).sort({ date: -1 });
    
    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/attendance/subjects/:id/records
// @desc    Mark attendance for a subject
// @access  Private
router.post('/subjects/:id/records', async (req, res) => {
  try {
    const { status, date } = req.body;
    
    if (!status || !['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ message: 'Please provide a valid status (Present/Absent)' });
    }
    
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Check if subject belongs to student
    if (subject.student.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to mark attendance for this subject' });
    }
    
    // Use provided date or today
    const attendanceDate = date ? new Date(date) : new Date();
    
    // Set time to midnight for date comparison (store only the date part)
    attendanceDate.setHours(0, 0, 0, 0);
    
    // Check if attendance already marked for the date
    const existingRecord = await Attendance.findOne({
      subject: subject._id,
      student: req.user.id,
      date: {
        $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(attendanceDate).setHours(23, 59, 59, 999))
      }
    });
    
    if (existingRecord) {
      // Update existing record
      existingRecord.status = status;
      await existingRecord.save();
      return res.json(existingRecord);
    }
    
    // Create new attendance record
    const attendance = new Attendance({
      subject: subject._id,
      student: req.user.id,
      status,
      date: attendanceDate
    });
    
    try {
      await attendance.save();
      res.json(attendance);
    } catch (saveErr) {
      // If there's a duplicate key error, find the record and update it instead
      if (saveErr.code === 11000) {
        console.log('Duplicate attendance record detected, updating instead');
        const record = await Attendance.findOneAndUpdate(
          {
            subject: subject._id,
            student: req.user.id,
            date: {
              $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
              $lt: new Date(new Date(attendanceDate).setHours(23, 59, 59, 999))
            }
          },
          { status },
          { new: true }
        );
        
        if (record) {
          return res.json(record);
        }
      }
      
      // Re-throw the error if it's not a duplicate key error or if we couldn't find the record
      throw saveErr;
    }
  } catch (err) {
    console.error('Error marking attendance:', err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @route   GET /api/attendance/subjects/:id/percentage
// @desc    Get attendance percentage for a subject
// @access  Private
router.get('/subjects/:id/percentage', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Check if subject belongs to student
    if (subject.student.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const records = await Attendance.find({ 
      subject: subject._id,
      student: req.user.id
    });
    
    const totalClasses = records.length;
    const presentClasses = records.filter(record => record.status === 'Present').length;
    
    const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
    
    res.json({
      subject: subject.name,
      totalClasses,
      presentClasses,
      percentage
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/attendance/percentage
// @desc    Get attendance percentage for all subjects
// @access  Private
router.get('/percentage', async (req, res) => {
  try {
    const subjects = await Subject.find({ student: req.user.id });
    
    const result = [];
    
    for (const subject of subjects) {
      const records = await Attendance.find({
        subject: subject._id,
        student: req.user.id
      });
      
      const totalClasses = records.length;
      const presentClasses = records.filter(record => record.status === 'Present').length;
      
      const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
      
      result.push({
        subjectId: subject._id,
        subjectName: subject.name,
        totalClasses,
        presentClasses,
        percentage
      });
    }
    
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/attendance/records/:id
// @desc    Delete an attendance record
// @access  Private
router.delete('/records/:id', async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Check if record belongs to student
    if (record.student.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await Attendance.findByIdAndDelete(record._id);
    
    res.json({ message: 'Record deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router; 