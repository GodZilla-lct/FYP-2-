const nodemailer = require('nodemailer');

/**
 * Email transporter configuration
 * Uses Gmail SMTP or custom SMTP server
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    // Skip email in development if SMTP not configured
    if (!process.env.SMTP_USER && process.env.NODE_ENV === 'development') {
      console.log('📧 Email (Dev Mode - Not Sent):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text || html}`);
      return { success: true, mode: 'development' };
    }

    const info = await transporter.sendMail({
      from: `"Campus Connect" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

/**
 * Send proposal status notification
 */
async function sendProposalStatusNotification(proposal, user, newStatus) {
  const statusMessages = {
    PENDING_COORDINATOR: 'Your proposal is awaiting coordinator review',
    PENDING_DIRECTOR_SSC: 'Your proposal is awaiting Director SSC review',
    PENDING_ASST_DIRECTOR: 'Your proposal is awaiting Assistant Director review',
    PENDING_FINANCE_SECRETARY: 'Your proposal is awaiting Finance Secretary review',
    PENDING_REGISTRAR: 'Your proposal is awaiting Registrar review',
    PENDING_VC: 'Your proposal is awaiting Vice Chancellor review',
    APPROVED: 'Your proposal has been approved! 🎉',
    RETURNED_FOR_REVISION: 'Your proposal has been returned for revision',
    REJECTED: 'Your proposal has been rejected',
  };

  const subject = `Proposal Status Update: ${proposal.title}`;
  const message = statusMessages[newStatus] || 'Your proposal status has been updated';

  const html = `
    <h2>Proposal Status Update</h2>
    <p>Hi ${user.name},</p>
    <p><strong>${message}</strong></p>
    <hr>
    <h3>${proposal.title}</h3>
    <p><strong>Current Status:</strong> ${newStatus.replace(/_/g, ' ')}</p>
    <p><strong>Event Date:</strong> ${new Date(proposal.event_date).toLocaleDateString()}</p>
    <p><strong>Budget:</strong> PKR ${proposal.budget_requested.toLocaleString()}</p>
    ${proposal.rejection_reason ? `<p><strong>Reason:</strong> ${proposal.rejection_reason}</p>` : ''}
    <hr>
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/proposals/${proposal.id}">View Proposal Details</a></p>
  `;

  return sendEmail({ to: user.email, subject, html });
}

/**
 * Send notification to next approver
 */
async function notifyNextApprover(proposal, approverEmail, approverName) {
  const subject = `New Proposal Awaiting Your Review: ${proposal.title}`;

  const html = `
    <h2>New Proposal Awaiting Review</h2>
    <p>Hi ${approverName},</p>
    <p>A new proposal requires your review and approval.</p>
    <hr>
    <h3>${proposal.title}</h3>
    <p><strong>Society:</strong> ${proposal.society_name}</p>
    <p><strong>Event Date:</strong> ${new Date(proposal.event_date).toLocaleDateString()}</p>
    <p><strong>Budget Requested:</strong> PKR ${proposal.budget_requested.toLocaleString()}</p>
    <p><strong>Description:</strong> ${proposal.description}</p>
    <hr>
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/proposals/${proposal.id}">Review Proposal</a></p>
  `;

  return sendEmail({ to: approverEmail, subject, html });
}

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(user) {
  const subject = 'Welcome to Campus Connect!';

  const html = `
    <h2>Welcome to Campus Connect!</h2>
    <p>Hi ${user.name},</p>
    <p>Your account has been created successfully.</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Role:</strong> ${user.role}</p>
    <p>You can now login and start using the platform.</p>
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">Login Now</a></p>
  `;

  return sendEmail({ to: user.email, subject, html });
}

module.exports = {
  sendEmail,
  sendProposalStatusNotification,
  notifyNextApprover,
  sendWelcomeEmail,
};
