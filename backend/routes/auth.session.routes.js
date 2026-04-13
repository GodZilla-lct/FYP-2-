const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/auth/logout', authController.logout);
router.post('/auth/change-password', authController.changePassword);
router.get('/auth/me', authController.getCurrentUser);

module.exports = router;
