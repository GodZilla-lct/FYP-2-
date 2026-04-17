const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const proposalController = require('../controllers/proposalController');
const superAdminController = require('../controllers/superAdminController');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validateRequest');
const {
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} = require('../validators/authValidator');

// Authentication routes with Zod validation
router.post('/auth/login', authLimiter, validate(loginSchema), authController.login);
router.post('/auth/refresh', authController.refreshAccessToken);
router.post('/auth/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/auth/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/auth/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/auth/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

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
