const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const ticketController = require('../controllers/ticketController');
const { isSuperAdmin } = require('../middleware/auth');

router.put('/super/users/:id/force-password', isSuperAdmin, superAdminController.forcePasswordReset);
router.put('/super/proposals/:id/force-status', isSuperAdmin, superAdminController.forceProposalStatus);
router.get('/super/tickets', isSuperAdmin, ticketController.getAllTickets);
router.put('/super/tickets/:id/resolve', isSuperAdmin, ticketController.resolveTicket);
router.put('/super/users/:id/role', isSuperAdmin, superAdminController.updateUserRole);
router.post('/super/system/rollover', isSuperAdmin, superAdminController.executeAcademicYearReset);
router.put('/super/system/settings', isSuperAdmin, superAdminController.updateSystemSettings);
router.post('/super/impersonate/:id', isSuperAdmin, superAdminController.impersonateUser);
router.get('/super/users', isSuperAdmin, superAdminController.getAllUsers);
router.get('/super/proposals', isSuperAdmin, superAdminController.getAllProposals);
router.get('/super/logs', isSuperAdmin, superAdminController.getSuperAdminLogs);

module.exports = router;
