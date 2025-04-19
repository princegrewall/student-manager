const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  date: {
    type: Date,
    required: [true, 'Please add event date']
  },
  clubType: {
    type: String,
    required: [true, 'Please specify the club type'],
    enum: ['Technical', 'Cultural', 'Sports']
  },
  location: {
    type: String,
    default: 'TBD'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema); 