const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const VisitorsController = require('../controllers/visitorsController'); // Import the controller

const router = express.Router();

// Route to create a new visitor pre-approval (protected, resident only)
router.post('/', authenticateToken, (req, res) => {
    VisitorsController.createPreApproval(req, res);
});

// Route to get all pre-approvals for a resident (protected, resident only)
router.get('/', authenticateToken, (req, res) => {
    VisitorsController.getAllPreApprovals(req, res);
});

// Route to get all pre-approvals for a resident (protected, with pagination)
router.get('/paginated', authenticateToken, (req, res) => {
  VisitorsController.getPaginatedPreApprovals(req, res);
});

// Route to get a specific pre-approval by ID (protected, resident or admin/security)
router.get('/:id', authenticateToken, (req, res) => {
    VisitorsController.getPreApprovalById(req, res);
});

// Route to update a visitor pre-approval (protected, creator or committee/admin)
router.put('/:id', authenticateToken, (req, res) => {
  VisitorsController.updatePreApproval(req, res);
});

// Route to delete a visitor pre-approval (protected, creator or committee/admin)
router.delete('/:id', authenticateToken, (req, res) => {
  VisitorsController.deletePreApproval(req, res);
});

module.exports = router;