const mongoose = require('mongoose');

const CurriculumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Please specify the semester'],
    min: 1,
    max: 8
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  fileLink: {
    type: String,
    required: [true, 'Please add a file link (PDF or Drive)']
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add explicit method to handle document deletion (to fix the 'remove is not a function' error)
CurriculumSchema.methods.remove = function() {
  return mongoose.model('Curriculum').deleteOne({ _id: this._id });
};

// Add a deleteOne method explicitly for backward compatibility
CurriculumSchema.methods.deleteOne = function() {
  return mongoose.model('Curriculum').deleteOne({ _id: this._id });
};

module.exports = mongoose.model('Curriculum', CurriculumSchema); 