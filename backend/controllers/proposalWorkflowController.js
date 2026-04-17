const db = require('../config/database');
const { createNotification } = require('./notificationController');
const { sendStandardNotification, sendVCMagicLink } = require('../utils/emailService');
const jwt = require('jsonwebtoken');

// Process proposal to next status (approve/reject)
const processProposalNextStatus = async (req, res) => {
  const { proposalId, action, rejectionReason, rejectionType } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  console.log('[WORKFLOW] Processing proposal:', { proposalId, action, rejectionType, userId, userRole });

  try {
    // Get current proposal
    const [proposals] = await db.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (proposals.length === 0) {
      console.log('[WORKFLOW] Proposal not found:', proposalId);
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposals[0];
    const currentStatus = proposal.current_status;

    console.log('[WORKFLOW] Current proposal status:', currentStatus);

    // Define workflow
    const workflow = {
      PENDING_COORDINATOR: { role: 'COORDINATOR', next: 'PENDING_DIRECTOR_SSC' },
      PENDING_DIRECTOR_SSC: { role: 'DIRECTOR_SSC', next: 'PENDING_ASST_DIRECTOR' },
      PENDING_ASST_DIRECTOR: { role: 'ASST_DIRECTOR', next: 'PENDING_FINANCE_SECRETARY' },
      PENDING_FINANCE_SECRETARY: { role: 'FINANCE_SECRETARY', next: 'PENDING_REGISTRAR' },
      PENDING_REGISTRAR: { role: 'REGISTRAR', next: 'PENDING_VC' },
      PENDING_VC: { role: 'VC', next: 'APPROVED' }
    };

    // Check if user has permission to process this status
    if (!workflow[currentStatus] || workflow[currentStatus].role !== userRole) {
      console.log('[WORKFLOW] Permission denied:', { currentStatus, userRole, expected: workflow[currentStatus]?.role });
      return res.status(403).json({ 
        error: 'You do not have permission to process this proposal at its current stage' 
      });
    }

    let newStatus;
    let notificationMessage;
    let notificationTitle;

    if (action === 'APPROVE') {
      newStatus = workflow[currentStatus].next;
      notificationTitle = 'Proposal Approved';
      notificationMessage = `Your proposal "${proposal.title}" has been approved by ${userRole}`;
      
      console.log('[WORKFLOW] Approving proposal, new status:', newStatus);
      
      // Update proposal status
      await db.query(
        'UPDATE proposals SET current_status = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, proposalId]
      );

      // Log approval in history
      await db.query(
        `INSERT INTO approval_history (proposal_id, approver_id, action, created_at)
         VALUES (?, ?, 'APPROVED', NOW())`,
        [proposalId, userId]
      );

    } else if (action === 'REJECT') {
      if (!rejectionReason) {
        console.log('[WORKFLOW] Rejection reason missing');
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const finalRejectionType = rejectionType || 'SOFT';
      newStatus = finalRejectionType === 'HARD' ? 'REJECTED' : 'RETURNED_FOR_REVISION';
      notificationTitle = finalRejectionType === 'HARD' ? 'Proposal Rejected' : 'Proposal Returned for Revision';
      notificationMessage = `Your proposal "${proposal.title}" has been ${finalRejectionType === 'HARD' ? 'rejected' : 'returned for revision'} by ${userRole}`;

      console.log('[WORKFLOW] Rejecting proposal:', { finalRejectionType, newStatus });

      // Update proposal with rejection
      await db.query(
        `UPDATE proposals 
         SET current_status = ?, 
             rejection_reason = ?, 
             rejection_type = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [newStatus, rejectionReason, finalRejectionType, proposalId]
      );

      // Log rejection in history
      await db.query(
        `INSERT INTO approval_history (proposal_id, approver_id, action, comments, created_at)
         VALUES (?, ?, 'REJECTED', ?, NOW())`,
        [proposalId, userId, rejectionReason]
      );

    } else if (action === 'RESUBMIT') {
      // Society resubmitting after soft rejection
      if (currentStatus !== 'RETURNED_FOR_REVISION') {
        console.log('[WORKFLOW] Cannot resubmit, wrong status:', currentStatus);
        return res.status(400).json({ error: 'Can only resubmit proposals that were returned for revision' });
      }

      newStatus = 'PENDING_COORDINATOR';
      notificationTitle = 'Proposal Resubmitted';
      notificationMessage = `Proposal "${proposal.title}" has been resubmitted`;

      console.log('[WORKFLOW] Resubmitting proposal');

      await db.query(
        `UPDATE proposals 
         SET current_status = ?, 
             rejection_reason = NULL,
             rejection_type = NULL,
             updated_at = NOW()
         WHERE id = ?`,
        [newStatus, proposalId]
      );

      await db.query(
        `INSERT INTO approval_history (proposal_id, approver_id, action, created_at)
         VALUES (?, ?, 'RESUBMITTED', NOW())`,
        [proposalId, userId]
      );

    } else {
      console.log('[WORKFLOW] Invalid action:', action);
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Create notification for proposal creator
    console.log('[WORKFLOW] Creating notification for user:', proposal.user_id);
    await createNotification(
      proposal.user_id,
      'PROPOSAL_STATUS',
      notificationTitle,
      notificationMessage,
      proposalId,
      userId
    );

    // CRITICAL: If Registrar approved and status is now PENDING_VC, send magic link email
    if (action === 'APPROVE' && newStatus === 'PENDING_VC') {
      try {
        // Generate magic link JWT token (7-day expiry)
        const magicToken = jwt.sign(
          { proposalId: proposal.id, role: 'VC' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Get proposal details with society info
        const [proposalDetails] = await db.query(
          `SELECT p.*, s.name as society_name 
           FROM proposals p 
           JOIN societies s ON p.society_id = s.id 
           WHERE p.id = ?`,
          [proposalId]
        );

        const proposalData = proposalDetails[0];

        // Send VC Magic Link email
        const vcEmail = process.env.VC_EMAIL || 'vc@uog.edu.pk';
        
        await sendVCMagicLink(vcEmail, proposalData, magicToken);
        console.log(`[EMAIL] 📧 VC Magic Link sent to ${vcEmail} for proposal #${proposalId}`);

      } catch (emailError) {
        console.error('[EMAIL] Failed to send VC magic link:', emailError);
        // Don't fail the request if email fails - proposal status is already updated
      }
    }

    // MODULE 4: Send privacy-first standard notification to proposal creator
    try {
      const [creatorInfo] = await db.query(
        'SELECT name, email FROM users WHERE id = ?',
        [proposal.user_id]
      );
      
      if (creatorInfo.length > 0) {
        await sendStandardNotification(creatorInfo[0].email, creatorInfo[0].name);
        console.log(`[EMAIL] 📧 Standard notification sent to ${creatorInfo[0].email}`);
      }
    } catch (emailError) {
      console.error('[EMAIL] Failed to send standard notification:', emailError);
    }

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`proposal_${proposalId}`).emit('proposalUpdate', {
        proposalId,
        newStatus,
        action,
        updatedBy: userRole
      });
    }

    res.json({
      success: true,
      message: `Proposal ${action.toLowerCase()}ed successfully`,
      newStatus
    });

    console.log('[WORKFLOW] Proposal processed successfully:', { proposalId, action, newStatus });

  } catch (error) {
    console.error('[WORKFLOW] Error processing proposal:', error);
    console.error('[WORKFLOW] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to process proposal',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

module.exports = {
  processProposalNextStatus
};
