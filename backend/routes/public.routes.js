const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const proposalController = require('../controllers/proposalController');
const superAdminController = require('../controllers/superAdminController');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  validateLogin,
  validateEmail,
  validatePasswordReset,
} = require('../middleware/validator');

// router.post('/auth/register', authLimiter, validateRegistration, authController.register);
router.post('/auth/login', authLimiter, validateLogin, authController.login);
router.post('/auth/refresh', authController.refreshAccessToken);
router.post('/auth/forgot-password', authLimiter, validateEmail, authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, validatePasswordReset, authController.resetPassword);
router.post('/auth/verify-email', authController.verifyEmail);

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '4.0',
    timestamp: new Date().toISOString(),
  });
});

router.get('/proposals/vc-action', proposalController.vcMagicLinkAction);
router.get('/system/settings', superAdminController.getSystemSettings);

module.exports = router;
