const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: [true, 'Please specify the attendance status']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a student can't mark attendance for the same subject on the same day more than once
AttendanceSchema.index({ subject: 1, student: 1, date: 1 }, { unique: true });

// Handle deprecated remove() method
AttendanceSchema.statics.findByIdAndRemove = async function(id) {
  return this.findByIdAndDelete(id);
};

// Add a method to use deleteOne instead of deprecated remove
AttendanceSchema.method('remove', function() {
  return this.constructor.deleteOne({ _id: this._id });
}, { suppressWarning: true });

module.exports = mongoose.model('Attendance', AttendanceSchema); 