const express = require('express');
const router = express.Router();

const authSessionRoutes = require('./auth.session.routes');
const profileRoutes = require('./profile.routes');
const proposalsRoutes = require('./proposals.routes');
const societiesRoutes = require('./societies.routes');
const usersRoutes = require('./users.routes');
const notificationsRoutes = require('./notifications.routes');
const analyticsRoutes = require('./analytics.routes');
const searchRoutes = require('./search.routes');
const budgetRoutes = require('./budget.routes');
const calendarRoutes = require('./calendar.routes');
const ticketsRoutes = require('./tickets.routes');
const dashboardRoutes = require('./dashboard.routes');
const superRoutes = require('./super.routes');
const cabinetRoutes = require('./cabinet.routes');
const venueRoutes = require('./venues.routes');

router.use(authSessionRoutes);
router.use('/profile', profileRoutes);
router.use(ticketsRoutes);
router.use(proposalsRoutes);
router.use(societiesRoutes);
router.use(usersRoutes);
router.use(notificationsRoutes);
router.use(analyticsRoutes);
router.use(searchRoutes);
router.use(budgetRoutes);
router.use(calendarRoutes);
router.use(dashboardRoutes);
router.use(superRoutes);
router.use('/cabinet', cabinetRoutes);
router.use(venueRoutes);

module.exports = router;
