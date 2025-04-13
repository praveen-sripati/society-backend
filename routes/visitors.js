const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const VisitorsController = require('../controllers/visitorsController'); // Import the controller
const { pool } = require('../config/database');

const router = express.Router();

// -- Pre Approvals --
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

// Route to get all upcoming pre-approvals for a resident paginated (protected, with pagination)
router.get('/paginated/upcoming', authenticateToken, (req, res) => {
  VisitorsController.getPaginatedPreApprovalsStatusPending(req, res);
});

// Route to get all expired pre-approvals for a resident paginated (protected, with pagination)
router.get('/paginated/expired', authenticateToken, (req, res) => {
  VisitorsController.getPaginatedPreApprovalsStatusExpired(req, res);
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



// Route to record visitor arrival
router.post('/arrivals', authenticateToken, (req, res) => {
  VisitorsController.createArrival(req, res);
});

// Route to record visitor departure
router.post('/departures/:arrivalId', authenticateToken, (req, res) => {
  VisitorsController.createDeparture(req, res);
});

// Route to get all visitor arrivals
router.get('/arrivals', authenticateToken, (req, res) => {
  VisitorsController.getArrivals(req, res);
});

// Route to get all visitor departures
router.get('/departures', authenticateToken, (req, res) => {
  VisitorsController.getDepartures(req, res);
});

// Route to get a paginated list of visitor arrivals
router.get('/arrivals/paginated', authenticateToken, (req, res) => {
  VisitorsController.getPaginatedArrivals(req, res);
});

// Route to get a paginated list of visitor departures
router.get('/departures/paginated', authenticateToken, (req, res) => {
  VisitorsController.getPaginatedDepartures(req, res);
});

// Route to get visitor activity for a resident
router.get('/activity/:residentId', authenticateToken, (req, res) => {
  VisitorsController.getVisitorActivityForResident(req, res);
});

module.exports = router;
