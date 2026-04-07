const db = require('../config/database');
const { createNotification } = require('./notificationController');

// Process proposal to next status (approve/reject)
const processProposalNextStatus = async (req, res) => {
  const { proposalId, action, rejectionReason, rejectionType } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Get current proposal
    const [proposals] = await db.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (proposals.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposals[0];
    const currentStatus = proposal.current_status;

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
      return res.status(403).json({ 
        error: 'You do not have permission to process this proposal at its current stage' 
      });
    }

    let newStatus;
    let notificationMessage;

    if (action === 'APPROVE') {
      newStatus = workflow[currentStatus].next;
      notificationMessage = `Your proposal "${proposal.title}" has been approved by ${userRole}`;
      
      // Update proposal status
      await db.query(
        'UPDATE proposals SET current_status = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, proposalId]
      );

      // Log approval in history
      await db.query(
        `INSERT INTO proposal_history (proposal_id, status, changed_by, changed_at)
         VALUES (?, ?, ?, NOW())`,
        [proposalId, newStatus, userId]
      );

    } else if (action === 'REJECT') {
      if (!rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const finalRejectionType = rejectionType || 'SOFT';
      newStatus = finalRejectionType === 'HARD' ? 'REJECTED' : 'RETURNED_FOR_REVISION';
      notificationMessage = `Your proposal "${proposal.title}" has been ${finalRejectionType === 'HARD' ? 'rejected' : 'returned for revision'} by ${userRole}`;

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
        `INSERT INTO proposal_history (proposal_id, status, changed_by, changed_at, notes)
         VALUES (?, ?, ?, NOW(), ?)`,
        [proposalId, newStatus, userId, rejectionReason]
      );

    } else if (action === 'RESUBMIT') {
      // Society resubmitting after soft rejection
      if (currentStatus !== 'RETURNED_FOR_REVISION') {
        return res.status(400).json({ error: 'Can only resubmit proposals that were returned for revision' });
      }

      newStatus = 'PENDING_COORDINATOR';
      notificationMessage = `Proposal "${proposal.title}" has been resubmitted`;

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
        `INSERT INTO proposal_history (proposal_id, status, changed_by, changed_at)
         VALUES (?, ?, ?, NOW())`,
        [proposalId, newStatus, userId]
      );

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Create notification for proposal creator
    await createNotification({
      userId: proposal.created_by,
      type: action === 'APPROVE' ? 'PROPOSAL_APPROVED' : 'PROPOSAL_REJECTED',
      title: action === 'APPROVE' ? 'Proposal Approved' : 'Proposal Update',
      message: notificationMessage,
      relatedProposalId: proposalId
    });

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

  } catch (error) {
    console.error('Error processing proposal:', error);
    res.status(500).json({ error: 'Failed to process proposal' });
  }
};

module.exports = {
  processProposalNextStatus
};
