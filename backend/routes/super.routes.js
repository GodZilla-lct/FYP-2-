const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const ticketController = require('../controllers/ticketController');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

// All super routes require authentication + SYSTEM_ADMIN role
router.put('/super/users/:id/force-password', authenticate, isSuperAdmin, superAdminController.forcePasswordReset);
router.put('/super/proposals/:id/force-status', authenticate, isSuperAdmin, superAdminController.forceProposalStatus);
router.get('/super/tickets', authenticate, isSuperAdmin, ticketController.getAllTickets);
router.put('/super/tickets/:id/resolve', authenticate, isSuperAdmin, ticketController.resolveTicket);
router.put('/super/users/:id/role', authenticate, isSuperAdmin, superAdminController.updateUserRole);
router.post('/super/system/rollover', authenticate, isSuperAdmin, superAdminController.executeAcademicYearReset);
router.put('/super/system/settings', authenticate, isSuperAdmin, superAdminController.updateSystemSettings);
router.post('/super/impersonate/:id', authenticate, isSuperAdmin, superAdminController.impersonateUser);
router.get('/super/users', authenticate, isSuperAdmin, superAdminController.getAllUsers);
router.get('/super/proposals', authenticate, isSuperAdmin, superAdminController.getAllProposals);
router.get('/super/logs', authenticate, isSuperAdmin, superAdminController.getSuperAdminLogs);

module.exports = router;
