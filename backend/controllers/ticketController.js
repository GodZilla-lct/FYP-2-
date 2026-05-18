const pool = require('../config/database');
const { sendEmail } = require('../utils/emailService');

/**
 * MODULE 3: FEEDBACK & ISSUE REPORTING
 * Support ticket system for users to report issues to System Admin
 */

/**
 * Send confirmation email to user when ticket is submitted
 */
async function sendTicketConfirmationEmail(user, ticket) {
  const subject = `[Ticket #${ticket.id}] We received your support request`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .ticket-box { background: white; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .label { font-weight: bold; color: #495057; }
        .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 Support Ticket Received</h1>
          <p>Campus Connect — University of Gujrat</p>
        </div>
        <div class="content">
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your support request has been received and will be reviewed by the System Administrator.</p>
          <div class="ticket-box">
            <p><span class="label">Ticket ID:</span> #${ticket.id}</p>
            <p><span class="label">Subject:</span> ${ticket.subject}</p>
            <p><span class="label">Message:</span><br>${ticket.message}</p>
            <p><span class="label">Status:</span> PENDING</p>
            <p><span class="label">Submitted:</span> ${new Date().toLocaleString()}</p>
          </div>
          <p>You will receive another email once your ticket is resolved.</p>
          <div class="footer">
            <p>This is an automated email from Campus Connect System.</p>
            <p><strong>University of Gujrat</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: user.email, subject, html });
}

/**
 * Send resolution email to user when ticket is resolved
 */
async function sendTicketResolvedEmail(user, ticket) {
  const subject = `[Ticket #${ticket.id}] Your support request has been resolved`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .ticket-box { background: white; border-left: 4px solid #28a745; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .label { font-weight: bold; color: #495057; }
        .resolved-badge { display: inline-block; background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; }
        .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Ticket Resolved</h1>
          <p>Campus Connect — University of Gujrat</p>
        </div>
        <div class="content">
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your support ticket has been reviewed and marked as resolved by the System Administrator.</p>
          <div class="ticket-box">
            <p><span class="label">Ticket ID:</span> #${ticket.id}</p>
            <p><span class="label">Subject:</span> ${ticket.subject}</p>
            <p><span class="label">Status:</span> <span class="resolved-badge">✓ RESOLVED</span></p>
            <p><span class="label">Resolved At:</span> ${new Date().toLocaleString()}</p>
          </div>
          <p>If you still have issues, feel free to submit a new support ticket.</p>
          <div class="footer">
            <p>This is an automated email from Campus Connect System.</p>
            <p><strong>University of Gujrat</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: user.email, subject, html });
}

/**
 * Notify System Admin when a new ticket is submitted
 */
async function sendAdminTicketAlertEmail(adminEmail, user, ticket) {
  const subject = `[NEW TICKET #${ticket.id}] ${ticket.subject}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .ticket-box { background: white; border-left: 4px solid #dc3545; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .label { font-weight: bold; color: #495057; }
        .button { display: inline-block; padding: 12px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 16px; }
        .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 New Support Ticket</h1>
          <p>Campus Connect — System Admin Alert</p>
        </div>
        <div class="content">
          <p>A new support ticket has been submitted and requires your attention.</p>
          <div class="ticket-box">
            <p><span class="label">Ticket ID:</span> #${ticket.id}</p>
            <p><span class="label">Subject:</span> ${ticket.subject}</p>
            <p><span class="label">Message:</span><br>${ticket.message}</p>
            <p><span class="label">Submitted By:</span> ${user.name} (${user.email})</p>
            <p><span class="label">Role:</span> ${user.role}</p>
            <p><span class="label">Submitted At:</span> ${new Date().toLocaleString()}</p>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/super-admin" class="button">
              View in Control Centre
            </a>
          </div>
          <div class="footer">
            <p>This is an automated alert from Campus Connect System.</p>
            <p><strong>University of Gujrat</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: adminEmail, subject, html });
}

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

    // Send confirmation email to user + alert to system admin
    try {
      const [userInfo] = await connection.query(
        'SELECT name, email, role FROM users WHERE id = ?',
        [userId]
      );
      const [adminInfo] = await connection.query(
        "SELECT email FROM users WHERE role = 'SYSTEM_ADMIN' LIMIT 1"
      );

      const ticketData = {
        id: result.insertId,
        subject: sanitizedSubject,
        message: sanitizedMessage
      };

      if (userInfo.length > 0) {
        await sendTicketConfirmationEmail(userInfo[0], ticketData);
        console.log(`[EMAIL] Ticket confirmation sent to ${userInfo[0].email}`);
      }

      if (adminInfo.length > 0) {
        await sendAdminTicketAlertEmail(
          adminInfo[0].email,
          userInfo[0] || { name: 'Unknown', email: 'unknown', role: 'STUDENT' },
          ticketData
        );
        console.log(`[EMAIL] Admin ticket alert sent to ${adminInfo[0].email}`);
      }
    } catch (emailError) {
      console.error('[EMAIL] Failed to send ticket emails:', emailError.message);
      // Don't fail the request if email fails
    }

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

    // Send resolution email to the user who submitted the ticket
    try {
      const [ticketFull] = await connection.query(
        `SELECT st.*, u.name as user_name, u.email as user_email
         FROM support_tickets st
         JOIN users u ON st.user_id = u.id
         WHERE st.id = ?`,
        [id]
      );

      if (ticketFull.length > 0) {
        const t = ticketFull[0];
        await sendTicketResolvedEmail(
          { name: t.user_name, email: t.user_email },
          { id: t.id, subject: t.subject }
        );
        console.log(`[EMAIL] Ticket resolved notification sent to ${t.user_email}`);
      }
    } catch (emailError) {
      console.error('[EMAIL] Failed to send ticket resolved email:', emailError.message);
    }

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
