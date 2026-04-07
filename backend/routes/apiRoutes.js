const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Controllers
const authController = require('../controllers/authController');
const proposalController = require('../controllers/proposalController');
const societyController = require('../controllers/societyController');
const proposalWorkflowController = require('../controllers/proposalWorkflowController');
const notificationController = require('../controllers/notificationController');
const commentController = require('../controllers/commentController');
const analyticsController = require('../controllers/analyticsController');
const searchController = require('../controllers/searchController');
const userController = require('../controllers/userController');
const budgetController = require('../controllers/budgetController');
const calendarController = require('../controllers/calendarController');

// Middleware
const { authenticate, authorize } = require('../middleware/auth');
const { apiLimiter, authLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { 
  validateLogin, 
  validateRegistration, 
  validateProposal, 
  validateEmail,
  validatePasswordReset,
  validateId 
} = require('../middleware/validator');
const { logActivity } = require('../middleware/activityLogger');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.baseUrl.includes('profile') ? 'profiles' : 'proposals';
    cb(null, `uploads/${uploadType}/`);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, DOCX, XLS, XLSX are allowed.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

// Apply rate limiting to all routes
router.use(apiLimiter);

// ===== AUTHENTICATION ROUTES (NO AUTH REQUIRED) =====
// REGISTRATION DISABLED - Only Director SSC/IT can create accounts via bulk import
// router.post('/auth/register', authLimiter, validateRegistration, authController.register);
router.post('/auth/login', authLimiter, validateLogin, authController.login);
router.post('/auth/refresh', authController.refreshAccessToken);
router.post('/auth/forgot-password', authLimiter, validateEmail, authController.forgotPassword);
router.post('/auth/reset-password', validatePasswordReset, authController.resetPassword);
router.post('/auth/verify-email', authController.verifyEmail);

// ===== HEALTH CHECK (NO AUTH REQUIRED) =====
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    version: '4.0',
    timestamp: new Date().toISOString()
  });
});

// ===== APPLY AUTHENTICATION TO ALL ROUTES BELOW =====
router.use(authenticate);
router.use(logActivity);

// ===== AUTHENTICATED ROUTES =====
router.post('/auth/logout', authController.logout);
router.post('/auth/change-password', authController.changePassword);
router.get('/auth/me', authController.getCurrentUser);

// ===== PROPOSAL ROUTES =====
router.get('/proposals', proposalController.getProposals);
router.post('/proposals', 
  uploadLimiter,
  upload.array('files', 5),
  validateProposal,
  proposalController.createProposal
);
router.get('/proposals/my-proposals', proposalController.getMyProposals);
router.get('/proposals/:id', validateId, proposalController.getProposalById);
router.put('/proposals/:id', validateId, proposalController.updateProposal);
router.delete('/proposals/:id', validateId, proposalController.deleteProposal);
router.post('/proposals/next-status', proposalWorkflowController.processProposalNextStatus);

// Draft proposals
router.get('/proposals/drafts/my-drafts', proposalController.getMyDrafts);
router.post('/proposals/drafts', proposalController.saveDraft);
router.put('/proposals/drafts/:id', validateId, proposalController.updateDraft);
router.delete('/proposals/drafts/:id', validateId, proposalController.deleteDraft);
router.post('/proposals/drafts/:id/publish', validateId, proposalController.publishDraft);

// ===== COMMENT ROUTES =====
router.get('/proposals/:id/comments', validateId, commentController.getComments);
router.post('/proposals/:id/comments', validateId, commentController.addComment);
router.put('/proposals/:proposalId/comments/:commentId', commentController.updateComment);
router.delete('/proposals/:proposalId/comments/:commentId', commentController.deleteComment);

// ===== SOCIETY ROUTES =====
router.get('/societies', societyController.getAllSocieties);
router.get('/societies/:id', validateId, societyController.getSocietyById);
router.post('/societies', authorize(['DIRECTOR_SSC']), societyController.createSociety);
router.put('/societies/:id', authorize(['DIRECTOR_SSC']), validateId, societyController.updateSociety);
router.post('/societies/cabinet-member', authorize(['DIRECTOR_SSC']), societyController.addCabinetMember);
router.delete('/societies/cabinet-member/:roleId', authorize(['DIRECTOR_SSC']), societyController.removeCabinetMember);

// ===== USER ROUTES =====
router.get('/users/profile', userController.getUserProfile);
router.put('/users/profile', userController.updateUserProfile);
router.post('/users/profile/picture', 
  uploadLimiter,
  upload.single('profilePicture'),
  userController.uploadProfilePicture
);
router.get('/users/activity', userController.getUserActivity);
router.put('/users/:id/deactivate', authorize(['DIRECTOR_SSC']), validateId, userController.deactivateUser);
router.put('/users/:id/reactivate', authorize(['DIRECTOR_SSC']), validateId, userController.reactivateUser);
router.post('/users/bulk-import', authorize(['DIRECTOR_SSC']), userController.bulkImportUsers);

// ===== NOTIFICATION ROUTES =====
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', validateId, notificationController.markAsRead);
router.put('/notifications/mark-all-read', notificationController.markAllAsRead);
router.get('/notifications/preferences', notificationController.getNotificationPreferences);
router.put('/notifications/preferences', notificationController.updateNotificationPreferences);

// ===== ANALYTICS ROUTES =====
router.get('/analytics/overview', analyticsController.getDashboardAnalytics);
router.get('/analytics/society/:id', validateId, analyticsController.getSocietyAnalytics);
router.get('/analytics/export', authorize(['DIRECTOR_SSC', 'VC', 'REGISTRAR']), analyticsController.exportAnalyticsReport);

// ===== SEARCH ROUTES =====
router.get('/search/proposals', searchController.searchProposals);
router.get('/search/users', searchController.searchUsers);
router.get('/search/filters', searchController.getSavedFilters);
router.post('/search/filters', searchController.saveSearchFilter);
router.delete('/search/filters/:id', validateId, searchController.deleteSavedFilter);

// ===== BUDGET ROUTES =====
router.get('/budget/allocations', authorize(['DIRECTOR_SSC', 'FINANCE_SECRETARY', 'VC']), budgetController.getBudgetAllocations);
router.post('/budget/allocations', authorize(['DIRECTOR_SSC', 'FINANCE_SECRETARY']), budgetController.setBudgetAllocation);
router.get('/budget/summary', authorize(['DIRECTOR_SSC', 'FINANCE_SECRETARY', 'VC']), budgetController.getBudgetSummary);
router.get('/budget/check/:societyId', budgetController.checkBudgetAvailability);

// ===== CALENDAR ROUTES =====
router.get('/calendar/events', calendarController.getCalendarEvents);
router.post('/calendar/events', authorize(['DIRECTOR_SSC', 'ASST_DIRECTOR']), calendarController.createCalendarEvent);
router.put('/calendar/events/:id', authorize(['DIRECTOR_SSC', 'ASST_DIRECTOR']), validateId, calendarController.updateCalendarEvent);
router.delete('/calendar/events/:id', authorize(['DIRECTOR_SSC']), validateId, calendarController.deleteCalendarEvent);
router.get('/calendar/check-conflicts', calendarController.checkEventConflicts);
router.get('/calendar/export', calendarController.exportCalendar);

// ===== ACTIVITY LOGS ROUTE =====
// Commented out until activityLogger exports getActivityLogs
// const { getActivityLogs } = require('../middleware/activityLogger');
// router.get('/activity-logs', authorize(['DIRECTOR_SSC', 'VC']), getActivityLogs);

// ===== DASHBOARD ROUTE =====
router.get('/dashboard', userController.getUserDashboard);

module.exports = router;
