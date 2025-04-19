const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');

// @desc    Get all subjects for current student
// @route   GET /api/attendance/subjects
// @access  Private
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ student: req.user.id }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Create a new subject
// @route   POST /api/attendance/subjects
// @access  Private
exports.createSubject = async (req, res) => {
  try {
    req.body.student = req.user.id;
    
    // Check if subject already exists for this student
    const existingSubject = await Subject.findOne({
      name: req.body.name,
      student: req.user.id
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'You already have a subject with this name'
      });
    }

    const subject = await Subject.create(req.body);

    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Delete a subject and all its attendance records
// @route   DELETE /api/attendance/subjects/:id
// @access  Private
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: `No subject with id of ${req.params.id}`
      });
    }

    // Make sure user owns the subject
    if (subject.student.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this subject'
      });
    }

    // Delete subject and all related attendance records
    await Promise.all([
      subject.deleteOne(),
      Attendance.deleteMany({ subject: req.params.id })
    ]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Get attendance records for a subject
// @route   GET /api/attendance/subjects/:subjectId/records
// @access  Private
exports.getAttendanceRecords = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: `No subject with id of ${req.params.subjectId}`
      });
    }

    // Make sure user owns the subject
    if (subject.student.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view attendance records for this subject'
      });
    }

    const attendanceRecords = await Attendance.find({ 
      subject: req.params.subjectId,
      student: req.user.id
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Mark attendance for a subject
// @route   POST /api/attendance/subjects/:subjectId/records
// @access  Private
exports.markAttendance = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: `No subject with id of ${req.params.subjectId}`
      });
    }

    // Make sure user owns the subject
    if (subject.student.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to mark attendance for this subject'
      });
    }

    const { status, date } = req.body;
    const formattedDate = date ? new Date(date) : new Date();

    // Clear time portion to allow one entry per day
    formattedDate.setHours(0, 0, 0, 0);

    // Check if attendance already marked for this date
    const existingRecord = await Attendance.findOne({
      subject: req.params.subjectId,
      student: req.user.id,
      date: formattedDate
    });

    if (existingRecord) {
      // Update existing record
      existingRecord.status = status;
      await existingRecord.save();

      return res.status(200).json({
        success: true,
        data: existingRecord
      });
    }

    // Create new attendance record
    const attendanceRecord = await Attendance.create({
      subject: req.params.subjectId,
      student: req.user.id,
      date: formattedDate,
      status
    });

    res.status(201).json({
      success: true,
      data: attendanceRecord
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Delete an attendance record
// @route   DELETE /api/attendance/records/:id
// @access  Private
exports.deleteAttendanceRecord = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `No attendance record with id of ${req.params.id}`
      });
    }

    // Make sure user owns the record
    if (record.student.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this attendance record'
      });
    }

    await record.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}; 