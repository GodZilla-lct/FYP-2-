const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { authenticateToken, isSuperAdmin } = require('../middleware/auth');

// Public/authenticated routes
router.get('/venues', authenticateToken, venueController.getAllVenues);
router.post('/venues/check-availability', authenticateToken, venueController.checkVenueAvailability);

// System Admin only routes
router.post('/venues', isSuperAdmin, venueController.createVenue);
router.put('/venues/:id', isSuperAdmin, venueController.updateVenue);
router.delete('/venues/:id', isSuperAdmin, venueController.deleteVenue);

module.exports = router;
