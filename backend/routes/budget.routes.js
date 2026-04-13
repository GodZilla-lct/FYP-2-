const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { authorize } = require('../middleware/auth');

router.get(
  '/budget/allocations',
  authorize(['DIRECTOR_SSC', 'FINANCE_SECRETARY', 'VC']),
  budgetController.getBudgetAllocations
);
router.post(
  '/budget/allocations',
  authorize(['DIRECTOR_SSC', 'FINANCE_SECRETARY']),
  budgetController.setBudgetAllocation
);
router.get(
  '/budget/summary',
  authorize(['DIRECTOR_SSC', 'FINANCE_SECRETARY', 'VC']),
  budgetController.getBudgetSummary
);
router.get('/budget/check/:societyId', budgetController.checkBudgetAvailability);

module.exports = router;
