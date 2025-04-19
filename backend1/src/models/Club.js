const mongoose = require('mongoose');

const SubClubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please specify the subclub name'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ClubSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Please specify the club type'],
    enum: ['Technical', 'Cultural', 'Sports', 'technical', 'cultural', 'sports'],
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }
  ],
  subclubs: [SubClubSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to capitalize the first letter of the club type
ClubSchema.pre('save', function(next) {
  if (this.isModified('type')) {
    this.type = this.type.charAt(0).toUpperCase() + this.type.slice(1).toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Club', ClubSchema); 