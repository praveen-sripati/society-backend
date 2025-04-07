const express = require('express');
const multer = require('multer');
const path = require('path');
const authenticateToken = require('../middleware/authMiddleware');
const noticeController = require('../controllers/noticeController');

const router = express.Router();

// Configure multer to store uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      let dest = 'uploads/notices/'; // Default destination
      if (file.fieldname === 'image') {
          dest = 'uploads/notices/images'; // Store images here
      } else if (file.fieldname === 'pdfAttachment') {
          dest = 'uploads/notices/pdfs'; // Store PDFs here
      }
      cb(null, dest);
  },
  filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + fileExt); // e.g., image-1678886400000-123456789.jpg
  },
});

const upload = multer({
  storage: storage,
  limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for all files (adjust as needed)
  },
  fileFilter: (req, file, cb) => {
      if (file.fieldname === 'pdfAttachment' && file.mimetype !== 'application/pdf') {
          return cb(new Error('Only PDF files are allowed!'), false);
      }
      if (file.fieldname === 'image' && !file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
  },
});

// Create a new notice (protected, committee/admin only)
router.post('/', authenticateToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdfAttachment', maxCount: 1 },
]), noticeController.asyncHandler(noticeController.createNotice.bind(noticeController)));

// Get all notices (protected, with optional filtering)
router.get('/', authenticateToken, noticeController.asyncHandler(noticeController.getAllNotices.bind(noticeController)));

// Get a specific notice by ID (protected)
router.get('/:id', authenticateToken, noticeController.asyncHandler(noticeController.getNoticeById.bind(noticeController)));

// Update a notice (protected, committee/admin only)
router.put('/:id', authenticateToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdfAttachment', maxCount: 1 },
]), noticeController.asyncHandler(noticeController.updateNotice.bind(noticeController)));

// Delete a notice (protected, committee/admin only)
router.delete('/:id', authenticateToken, noticeController.asyncHandler(noticeController.deleteNotice.bind(noticeController)));

module.exports = router;