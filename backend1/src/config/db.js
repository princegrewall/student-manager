const mongoose = require('mongoose');

/**
 * Sanitizes a MongoDB connection string by fixing common issues
 * @param {string} uri - The MongoDB connection string
 * @returns {string} - The sanitized connection string
 */
function sanitizeConnectionString(uri) {
  if (!uri) return uri;
  
  // Fix common issue with ">" character in password section
  let sanitized = uri.replace(/:(.*?)>@/, ':$1@');
  
  // Add default database if missing
  if (sanitized.endsWith('/')) {
    sanitized += 'college';
  }
  
  // Add query parameters if missing
  if (!sanitized.includes('?')) {
    sanitized += '?retryWrites=true&w=majority';
  }
  
  return sanitized;
}

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    // Sanitize the connection string
    const connectionString = sanitizeConnectionString(process.env.MONGODB_URI);
    
    // Log sanitized string (hide password)
    const logString = connectionString.replace(/:[^:@]+@/, ':****@');
    console.log('Using connection string:', logString); 
    
    const conn = await mongoose.connect(connectionString);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    
    // More detailed error information for common MongoDB connection issues
    if (err.message.includes('bad auth')) {
      console.error('Authentication failed - please check your username and password in the connection string');
    } else if (err.message.includes('ENOTFOUND')) {
      console.error('Could not reach the MongoDB server - please check your hostname');
    } else if (err.message.includes('timed out')) {
      console.error('Connection timed out - the MongoDB server might be down or behind a firewall');
    }
    
    // Don't exit the process in development to allow for automatic restarts
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw err; // Rethrow to allow handling in server.js
  }
};

module.exports = connectDB; 