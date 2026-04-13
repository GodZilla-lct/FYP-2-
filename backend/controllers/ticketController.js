const pool = require('../config/database');

/**
 * MODULE 3: FEEDBACK & ISSUE REPORTING
 * Support ticket system for users to report issues to System Admin
 */

/**
 * Submit Support Ticket (User Facing)
 * POST /api/tickets
 * 
 * Allows any authenticated user to submit feedback or report issues
 * Tickets go directly to System Admin Control Centre
 */
async function submitTicket(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const { subject, message } = req.body;

    // Validate input
    if (!subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Both subject and message are required'
      });
    }

    // Sanitize input
    const sanitizedSubject = subject.trim().substring(0, 255);
    const sanitizedMessage = message.trim();

    if (sanitizedSubject.length === 0 || sanitizedMessage.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid input',
        message: 'Subject and message cannot be empty'
      });
    }

    // Insert ticket into database
    const [result] = await connection.query(
      `INSERT INTO support_tickets (user_id, subject, message, status, created_at)
       VALUES (?, ?, ?, 'PENDING', NOW())`,
      [userId, sanitizedSubject, sanitizedMessage]
    );

    console.log(`[SUPPORT TICKET] User ${userId} submitted ticket #${result.insertId}: ${sanitizedSubject}`);

    res.status(201).json({
      success: true,
      message: 'Issue sent to IT Support',
      ticketId: result.insertId,
      ticket: {
        id: result.insertId,
        subject: sanitizedSubject,
        message: sanitizedMessage,
        status: 'PENDING',
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('Submit ticket error:', error);
    res.status(500).json({ 
      error: 'Failed to submit ticket',
      message: 'An error occurred while submitting your feedback'
    });
  } finally {
    connection.release();
  }
}

/**
 * Get All Support Tickets (Super Admin Facing)
 * GET /api/super/tickets
 * 
 * Protected by isSuperAdmin middleware
 * Returns all tickets with user information
 */
async function getAllTickets(req, res) {
  const connection = await pool.getConnection();

  try {
    // Fetch all tickets with user information
    const [tickets] = await connection.query(
      `SELECT 
        st.id,
        st.subject,
        st.message,
        st.status,
        st.created_at,
        st.resolved_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        resolver.name as resolved_by_name
       FROM support_tickets st
       JOIN users u ON st.user_id = u.id
       LEFT JOIN users resolver ON st.resolved_by = resolver.id
       ORDER BY 
         CASE st.status 
           WHEN 'PENDING' THEN 1 
           WHEN 'RESOLVED' THEN 2 
         END,
         st.created_at DESC`
    );

    res.json({
      success: true,
      tickets,
      stats: {
        total: tickets.length,
        pending: tickets.filter(t => t.status === 'PENDING').length,
        resolved: tickets.filter(t => t.status === 'RESOLVED').length
      }
    });

  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tickets',
      message: 'An error occurred while fetching support tickets'
    });
  } finally {
    connection.release();
  }
}

/**
 * Resolve Support Ticket (Super Admin Facing)
 * PUT /api/super/tickets/:id/resolve
 * 
 * Protected by isSuperAdmin middleware
 * Marks a ticket as resolved
 */
async function resolveTicket(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Check if ticket exists
    const [tickets] = await connection.query(
      'SELECT id, status, subject FROM support_tickets WHERE id = ?',
      [id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ 
        error: 'Ticket not found',
        message: 'The specified support ticket does not exist'
      });
    }

    const ticket = tickets[0];

    if (ticket.status === 'RESOLVED') {
      return res.status(400).json({ 
        error: 'Ticket already resolved',
        message: 'This ticket has already been marked as resolved'
      });
    }

    // Update ticket status to RESOLVED
    await connection.query(
      `UPDATE support_tickets 
       SET status = 'RESOLVED', resolved_at = NOW(), resolved_by = ?
       WHERE id = ?`,
      [adminId, id]
    );

    console.log(`[SUPPORT TICKET] Admin ${adminId} resolved ticket #${id}: ${ticket.subject}`);

    res.json({
      success: true,
      message: 'Ticket marked as resolved',
      ticketId: parseInt(id)
    });

  } catch (error) {
    console.error('Resolve ticket error:', error);
    res.status(500).json({ 
      error: 'Failed to resolve ticket',
      message: 'An error occurred while resolving the ticket'
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  submitTicket,
  getAllTickets,
  resolveTicket
};
