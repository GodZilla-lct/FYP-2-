const pool = require('../config/database');

/**
 * Get calendar events
 * GET /calendar/events
 */
async function getCalendarEvents(req, res) {
  const connection = await pool.getConnection();

  try {
    const { startDate, endDate, societyId } = req.query;

    let query = `
      SELECT 
        ce.*,
        p.title as proposal_title,
        p.budget_requested,
        s.name as society_name
      FROM calendar_events ce
      JOIN proposals p ON ce.proposal_id = p.id
      JOIN societies s ON p.society_id = s.id
      WHERE p.current_status = 'APPROVED'
    `;

    const params = [];

    if (startDate) {
      query += ' AND ce.event_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND ce.event_date <= ?';
      params.push(endDate);
    }

    if (societyId) {
      query += ' AND p.society_id = ?';
      params.push(societyId);
    }

    query += ' ORDER BY ce.event_date ASC';

    const [events] = await connection.query(query, params);

    res.json({
      success: true,
      events,
    });

  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  } finally {
    connection.release();
  }
}

/**
 * Create calendar event from approved proposal
 * POST /calendar/events
 */
async function createCalendarEvent(req, res) {
  const connection = await pool.getConnection();

  try {
    const { proposalId, startTime, endTime, location } = req.body;

    // Verify proposal is approved
    const [proposals] = await connection.query(
      `SELECT p.*, s.name as society_name
       FROM proposals p
       JOIN societies s ON p.society_id = s.id
       WHERE p.id = ? AND p.current_status = 'APPROVED'`,
      [proposalId]
    );

    if (proposals.length === 0) {
      return res.status(404).json({ 
        error: 'Proposal not found or not approved',
        message: 'Only approved proposals can be added to calendar'
      });
    }

    const proposal = proposals[0];

    // Check if event already exists
    const [existing] = await connection.query(
      'SELECT id FROM calendar_events WHERE proposal_id = ?',
      [proposalId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Event already exists',
        message: 'This proposal is already in the calendar'
      });
    }

    // Create calendar event
    const [result] = await connection.query(
      `INSERT INTO calendar_events (proposal_id, title, description, event_date, start_time, end_time, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [proposalId, proposal.title, proposal.description, proposal.event_date, startTime, endTime, location]
    );

    res.status(201).json({
      success: true,
      message: 'Event added to calendar',
      eventId: result.insertId,
    });

  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  } finally {
    connection.release();
  }
}

/**
 * Update calendar event
 * PUT /calendar/events/:id
 */
async function updateCalendarEvent(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { startTime, endTime, location, title, description } = req.body;

    const updateData = {};
    if (startTime !== undefined) updateData.start_time = startTime;
    if (endTime !== undefined) updateData.end_time = endTime;
    if (location !== undefined) updateData.location = location;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await connection.query(
      'UPDATE calendar_events SET ? WHERE id = ?',
      [updateData, id]
    );

    res.json({
      success: true,
      message: 'Calendar event updated successfully',
    });

  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  } finally {
    connection.release();
  }
}

/**
 * Delete calendar event
 * DELETE /calendar/events/:id
 */
async function deleteCalendarEvent(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.query('DELETE FROM calendar_events WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Calendar event deleted successfully',
    });

  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  } finally {
    connection.release();
  }
}

/**
 * Check for event conflicts
 * GET /calendar/check-conflicts
 */
async function checkEventConflicts(req, res) {
  const connection = await pool.getConnection();

  try {
    const { eventDate, startTime, endTime, excludeEventId } = req.query;

    if (!eventDate || !startTime || !endTime) {
      return res.status(400).json({ error: 'Event date, start time, and end time are required' });
    }

    let query = `
      SELECT ce.*, p.title, s.name as society_name
      FROM calendar_events ce
      JOIN proposals p ON ce.proposal_id = p.id
      JOIN societies s ON p.society_id = s.id
      WHERE ce.event_date = ?
      AND (
        (ce.start_time <= ? AND ce.end_time >= ?) OR
        (ce.start_time <= ? AND ce.end_time >= ?) OR
        (ce.start_time >= ? AND ce.end_time <= ?)
      )
    `;

    const params = [eventDate, startTime, startTime, endTime, endTime, startTime, endTime];

    if (excludeEventId) {
      query += ' AND ce.id != ?';
      params.push(excludeEventId);
    }

    const [conflicts] = await connection.query(query, params);

    res.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
    });

  } catch (error) {
    console.error('Check conflicts error:', error);
    res.status(500).json({ error: 'Failed to check conflicts' });
  } finally {
    connection.release();
  }
}

/**
 * Export calendar to iCal format
 * GET /calendar/export
 */
async function exportCalendar(req, res) {
  const connection = await pool.getConnection();

  try {
    const { societyId, startDate, endDate } = req.query;

    let query = `
      SELECT ce.*, p.title, p.description, s.name as society_name
      FROM calendar_events ce
      JOIN proposals p ON ce.proposal_id = p.id
      JOIN societies s ON p.society_id = s.id
      WHERE p.current_status = 'APPROVED'
    `;

    const params = [];

    if (societyId) {
      query += ' AND p.society_id = ?';
      params.push(societyId);
    }

    if (startDate) {
      query += ' AND ce.event_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND ce.event_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY ce.event_date ASC';

    const [events] = await connection.query(query, params);

    // Generate iCal format
    let ical = 'BEGIN:VCALENDAR\n';
    ical += 'VERSION:2.0\n';
    ical += 'PRODID:-//Campus Connect//Events Calendar//EN\n';
    ical += 'CALSCALE:GREGORIAN\n';

    for (const event of events) {
      const eventDate = new Date(event.event_date);
      const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      ical += 'BEGIN:VEVENT\n';
      ical += `UID:${event.id}@campusconnect.uog.edu.pk\n`;
      ical += `DTSTAMP:${dateStr}\n`;
      ical += `DTSTART:${dateStr}\n`;
      ical += `SUMMARY:${event.title} - ${event.society_name}\n`;
      ical += `DESCRIPTION:${event.description || ''}\n`;
      if (event.location) {
        ical += `LOCATION:${event.location}\n`;
      }
      ical += 'END:VEVENT\n';
    }

    ical += 'END:VCALENDAR\n';

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename=campus_connect_events.ics');
    res.send(ical);

  } catch (error) {
    console.error('Export calendar error:', error);
    res.status(500).json({ error: 'Failed to export calendar' });
  } finally {
    connection.release();
  }
}

module.exports = {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  checkEventConflicts,
  exportCalendar,
};
