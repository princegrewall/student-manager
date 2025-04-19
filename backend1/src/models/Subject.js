const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a subject name'],
    trim: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Add timestamps for better tracking
  timestamps: true,
  // Enable virtual properties in JSON
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a compound index on name and student to ensure uniqueness
SubjectSchema.index({ name: 1, student: 1 }, { unique: true });

// Handle deprecated remove() method
SubjectSchema.statics.findByIdAndRemove = async function(id) {
  return this.findByIdAndDelete(id);
};

// Add a method to use deleteOne instead of deprecated remove
SubjectSchema.method('remove', function() {
  return this.constructor.deleteOne({ _id: this._id });
}, { suppressWarning: true });

// Virtual to get attendance records for this subject
SubjectSchema.virtual('attendanceRecords', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'subject',
  justOne: false
});

module.exports = mongoose.model('Subject', SubjectSchema); 