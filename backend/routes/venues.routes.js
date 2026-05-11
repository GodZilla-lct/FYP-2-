const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { authenticate, authorize, isSuperAdmin } = require('../middleware/auth');

// Public/authenticated routes
router.get('/venues', authenticate, venueController.getAllVenues);
router.post('/venues/check-availability', authenticate, venueController.checkVenueAvailability);

// System Admin only routes
router.post('/venues', authenticate, isSuperAdmin, venueController.createVenue);
router.put('/venues/:id', authenticate, isSuperAdmin, venueController.updateVenue);
router.delete('/venues/:id', authenticate, isSuperAdmin, venueController.deleteVenue);

module.exports = router;
