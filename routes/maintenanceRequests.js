const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const maintenanceRequestController = require('../controllers/maintenanceRequestController');

const router = express.Router();

// Create a new maintenance request (protected, resident only)
router.post('/', authenticateToken, maintenanceRequestController.asyncHandler(maintenanceRequestController.createRequest.bind(maintenanceRequestController)));

// Get all maintenance requests (protected, with optional filtering)
router.get('/', authenticateToken, maintenanceRequestController.asyncHandler(maintenanceRequestController.getAllRequests.bind(maintenanceRequestController)));

// Get a specific maintenance request by ID (protected)
router.get('/:id', authenticateToken, maintenanceRequestController.asyncHandler(maintenanceRequestController.getRequestById.bind(maintenanceRequestController)));

// Update a maintenance request (protected, committee/admin only)
router.put('/:id', authenticateToken, maintenanceRequestController.asyncHandler(maintenanceRequestController.updateRequest.bind(maintenanceRequestController)));

// Submit feedback for a maintenance request (protected, resident only)
router.post('/:id/feedback', authenticateToken, maintenanceRequestController.asyncHandler(maintenanceRequestController.submitFeedback.bind(maintenanceRequestController)));

module.exports = router;