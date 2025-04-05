const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const noticeController = require('../controllers/noticeController');

const router = express.Router();

// Create a new notice (protected, committee/admin only)
router.post('/', authenticateToken, noticeController.asyncHandler(noticeController.createNotice.bind(noticeController)));

// Get all notices (protected, with optional filtering)
router.get('/', authenticateToken, noticeController.asyncHandler(noticeController.getAllNotices.bind(noticeController)));

// Get a specific notice by ID (protected)
router.get('/:id', authenticateToken, noticeController.asyncHandler(noticeController.getNoticeById.bind(noticeController)));

// Update a notice (protected, committee/admin only)
router.put('/:id', authenticateToken, noticeController.asyncHandler(noticeController.updateNotice.bind(noticeController)));

// Delete a notice (protected, committee/admin only)
router.delete('/:id', authenticateToken, noticeController.asyncHandler(noticeController.deleteNotice.bind(noticeController)));

module.exports = router;