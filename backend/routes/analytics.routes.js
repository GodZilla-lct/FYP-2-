const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authorize } = require('../middleware/auth');
const { validateId } = require('../middleware/validator');

router.get('/analytics/overview', analyticsController.getDashboardAnalytics);
router.get('/analytics/society/:id', validateId, analyticsController.getSocietyAnalytics);
router.get(
  '/analytics/export',
  authorize(['DIRECTOR_SSC', 'VC', 'REGISTRAR']),
  analyticsController.exportAnalyticsReport
);

module.exports = router;
