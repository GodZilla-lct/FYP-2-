const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authorize } = require('../middleware/auth');
const { validateId } = require('../middleware/validator');

router.get('/calendar/events', calendarController.getCalendarEvents);
router.post('/calendar/events', authorize(['DIRECTOR_SSC', 'ASST_DIRECTOR']), calendarController.createCalendarEvent);
router.put(
  '/calendar/events/:id',
  authorize(['DIRECTOR_SSC', 'ASST_DIRECTOR']),
  validateId,
  calendarController.updateCalendarEvent
);
router.delete('/calendar/events/:id', authorize(['DIRECTOR_SSC']), validateId, calendarController.deleteCalendarEvent);
router.get('/calendar/check-conflicts', calendarController.checkEventConflicts);
router.get('/calendar/export', calendarController.exportCalendar);

module.exports = router;
