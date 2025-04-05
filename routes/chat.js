const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

const router = express.Router();

// --- Group Management ---

// Create a new group (protected, any authenticated user)
router.post('/groups', authenticateToken, chatController.asyncHandler(chatController.createGroup.bind(chatController)));

// Get all groups (protected, any authenticated user)
router.get('/groups', authenticateToken, chatController.asyncHandler(chatController.getAllGroups.bind(chatController)));

// Get a specific group by ID (protected, any authenticated user)
router.get('/groups/:id', authenticateToken, chatController.asyncHandler(chatController.getGroupById.bind(chatController)));

// --- Message Management ---

// Send a new message (protected, any authenticated user)
router.post('/messages', authenticateToken, chatController.asyncHandler(chatController.sendMessage.bind(chatController)));

// Get all messages (protected, with optional group_id filtering, any authenticated user)
router.get('/messages', authenticateToken, chatController.asyncHandler(chatController.getAllMessages.bind(chatController)));

// Get a specific message by ID (protected, any authenticated user)
router.get('/messages/:id', authenticateToken, chatController.asyncHandler(chatController.getMessageById.bind(chatController)));

module.exports = router;