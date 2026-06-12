const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { validateId } = require('../middleware/validator');

router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/mark-all-read', notificationController.markAllAsRead);
router.put('/notifications/:id/read', validateId, notificationController.markAsRead);
router.delete('/notifications/:id', validateId, notificationController.deleteNotification);
router.get('/notifications/preferences', notificationController.getNotificationPreferences);
router.put('/notifications/preferences', notificationController.updateNotificationPreferences);

module.exports = router;
