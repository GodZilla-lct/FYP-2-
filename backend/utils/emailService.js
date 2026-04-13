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
 * MODULE 4: PRIVACY-FIRST EMAIL NOTIFICATIONS
 * Send standard notification to users (NO proposal details included)
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 */
async function sendStandardNotification(email, name) {
  const subject = 'New Notification - Campus Connect';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Notification</h1>
          <p>Campus Connect - University of Gujrat</p>
        </div>
        
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>You have a new notification waiting for you on Campus Connect.</p>
          <p>Please log in to your portal to view the details.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
              Login to Campus Connect
            </a>
          </div>

          <div class="footer">
            <p><strong>Privacy Notice:</strong> For security reasons, notification details are only visible after login.</p>
            <p>This is an automated email from Campus Connect System.</p>
            <p>University of Gujrat</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * MODULE 4: VC MAGIC LINK EMAIL
 * Send detailed proposal email to VC with approve/reject buttons
 * 
 * IMPORTANT: VC email is retrieved from environment variable (process.env.VC_EMAIL)
 * VC users no longer exist in the database - they approve via email only
 * 
 * @param {string} email - VC email address (from process.env.VC_EMAIL)
 * @param {Object} proposal - Full proposal object with all details
 * @param {string} magicToken - JWT token for magic link authentication
 */
async function sendVCMagicLink(email, proposal, magicToken) {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  const approveLink = `${baseUrl}/api/proposals/vc-action?token=${magicToken}&action=approve`;
  const rejectLink = `${baseUrl}/api/proposals/vc-action?token=${magicToken}&action=reject`;

  const subject = `[ACTION REQUIRED] Proposal Approval: ${proposal.title}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .proposal-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .proposal-box p { margin: 12px 0; }
        .label { font-weight: bold; color: #495057; display: inline-block; min-width: 140px; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 18px 45px; margin: 10px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; transition: all 0.3s; }
        .approve-btn { background: #28a745; color: white; }
        .reject-btn { background: #dc3545; color: white; }
        .approve-btn:hover { background: #218838; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(40,167,69,0.3); }
        .reject-btn:hover { background: #c82333; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(220,53,69,0.3); }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; border-top: 2px solid #dee2e6; padding-top: 20px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Proposal Awaiting Your Approval</h1>
          <p>University of Gujrat - Campus Connect</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>Vice Chancellor</strong>,</p>
          <p>A proposal has been approved by the Registrar and now requires your final approval.</p>
          
          <div class="proposal-box">
            <h2 style="margin-top: 0; color: #667eea;">${proposal.title}</h2>
            <p><span class="label">Society:</span> ${proposal.society_name}</p>
            <p><span class="label">Event Date:</span> ${new Date(proposal.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><span class="label">Budget Requested:</span> <strong>PKR ${parseFloat(proposal.total_budget || proposal.budget_requested).toLocaleString()}</strong></p>
            <p><span class="label">Description:</span></p>
            <p style="margin-left: 20px; color: #495057;">${proposal.description}</p>
          </div>

          <div class="button-container">
            <a href="${approveLink}" class="button approve-btn">✅ APPROVE PROPOSAL</a>
            <a href="${rejectLink}" class="button reject-btn">❌ REJECT PROPOSAL</a>
          </div>

          <div class="warning">
            <strong>⚠️ Important:</strong> Clicking either button will immediately process your decision. This action cannot be undone.
          </div>

          <div class="footer">
            <p><strong>Security Notice:</strong> These links are valid for 7 days and can only be used once.</p>
            <p>If you did not expect this email, please contact the Registrar's office immediately.</p>
            <p>This is an automated email from Campus Connect System.</p>
            <p><strong>University of Gujrat</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
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

/**
 * PHASE 1: Password reset via 6-digit OTP (no magic link; enterprise firewall friendly)
 * @param {{ to: string, name: string, otp: string }} params
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendPasswordResetOtpEmail({ to, name, otp }) {
  const safeName = escapeHtml(name);
  const subject = 'Your Campus Connect password reset code';
  const text = [
    `Hi ${name},`,
    '',
    `Your password reset code is: ${otp}`,
    '',
    'This code expires in 10 minutes.',
    'If you did not request a reset, ignore this email.',
    '',
    'University of Gujrat — Campus Connect',
  ].join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 560px; margin: 0 auto; padding: 24px; }
        .code {
          font-size: 28px; letter-spacing: 8px; font-weight: bold;
          background: #f1f3f5; padding: 16px 24px; border-radius: 8px;
          text-align: center; margin: 24px 0; user-select: all;
        }
        .muted { color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password reset</h2>
        <p>Hi <strong>${safeName}</strong>,</p>
        <p>Use this one-time code in the Campus Connect app (Forgot password):</p>
        <div class="code">${otp}</div>
        <p class="muted">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p class="muted">If you did not request this, you can ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, text, html });
}

module.exports = {
  sendEmail,
  sendStandardNotification,
  sendVCMagicLink,
  sendWelcomeEmail,
  sendPasswordResetOtpEmail,
};
