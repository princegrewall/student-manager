const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Club = require('../models/Club');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

// Import data into DB
const importData = async () => {
  try {
    // Clear existing data
    await Club.deleteMany();

    // Create initial clubs
    await Club.create([
      {
        type: 'Technical',
        description: 'For students interested in programming, coding challenges, and tech projects'
      },
      {
        type: 'Cultural',
        description: 'For students interested in dance, music, art, and cultural performances'
      },
      {
        type: 'Sports',
        description: 'For students interested in sports, fitness, and athletic activities'
      }
    ]);

    console.log('Data imported successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Delete data from DB
const deleteData = async () => {
  try {
    await Club.deleteMany();

    console.log('Data deleted successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Determine which operation to run based on command line args
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please use -i (import) or -d (delete) as arguments');
  process.exit();
} 