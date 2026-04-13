const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const publicRoutes = require('./public.routes');
const protectedRoutes = require('./protected.routes');

router.use(publicRoutes);
router.use(authenticate);
router.use(logActivity);
router.use(protectedRoutes);

module.exports = router;
