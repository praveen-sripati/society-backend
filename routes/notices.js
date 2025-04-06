const express = require('express');
const multer = require('multer');
const path = require('path');
const authenticateToken = require('../middleware/authMiddleware');
const noticeController = require('../controllers/noticeController');

const router = express.Router();

// Configure multer to store uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/notices/'); // Store images in the 'uploads/notices' directory (create this directory)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExt); // e.g., image-1678886400000-123456789.jpg
    },
});

const upload = multer({ storage: storage });

// Create a new notice (protected, committee/admin only)
router.post('/', authenticateToken, upload.single('image'), noticeController.asyncHandler(noticeController.createNotice.bind(noticeController)));

// Get all notices (protected, with optional filtering)
router.get('/', authenticateToken, noticeController.asyncHandler(noticeController.getAllNotices.bind(noticeController)));

// Get a specific notice by ID (protected)
router.get('/:id', authenticateToken, noticeController.asyncHandler(noticeController.getNoticeById.bind(noticeController)));

// Update a notice (protected, committee/admin only)
router.put('/:id', authenticateToken, noticeController.asyncHandler(noticeController.updateNotice.bind(noticeController)));

// Delete a notice (protected, committee/admin only)
router.delete('/:id', authenticateToken, noticeController.asyncHandler(noticeController.deleteNotice.bind(noticeController)));

module.exports = router;