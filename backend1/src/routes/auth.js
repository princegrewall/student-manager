const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/teacher/register', register);
router.post('/coordinator/register', register);
router.post('/login', login);

// Role-specific login routes
router.post('/teacher/login', login);
router.post('/coordinator/login', login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router; 