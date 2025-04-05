const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const authenticateToken = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

// Resident Registration with JWT Generation
router.post('/register/resident', userController.asyncHandler(userController.registerResident.bind(userController)));

// User Login
router.post('/login', userController.asyncHandler(userController.login.bind(userController)));

// Protected route example: Get current user details
router.get('/me', authenticateToken, userController.asyncHandler(userController.getCurrentUser.bind(userController)));

// Logout route
router.post('/logout', authenticateToken, userController.asyncHandler(userController.logout.bind(userController)));

module.exports = router;
