const pool = require('../config/database');
const { createNotification } = require('./notificationController');

/**
 * Get comments for a proposal
 * GET /proposals/:id/comments
 */
async function getComments(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    // Verify proposal exists
    const [proposals] = await connection.query(
      'SELECT id FROM proposals WHERE id = ?',
      [id]
    );

    if (proposals.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Get comments with user info
    const [comments] = await connection.query(
      `SELECT c.*, u.name as user_name, u.role as user_role
       FROM proposal_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.proposal_id = ?
       ORDER BY c.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      comments,
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  } finally {
    connection.release();
  }
}

/**
 * Add comment to proposal
 * POST /proposals/:id/comments
 */
async function addComment(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    if (comment.length > 2000) {
      return res.status(400).json({ error: 'Comment is too long (max 2000 characters)' });
    }

    // Verify proposal exists and get creator
    const [proposals] = await connection.query(
      'SELECT user_id, title FROM proposals WHERE id = ?',
      [id]
    );

    if (proposals.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposals[0];

    // Insert comment
    const [result] = await connection.query(
      'INSERT INTO proposal_comments (proposal_id, user_id, comment) VALUES (?, ?, ?)',
      [id, userId, comment.trim()]
    );

    // Create notification for proposal creator (if not commenting on own proposal)
    if (proposal.user_id !== userId) {
      await createNotification(
        proposal.user_id,
        'COMMENT',
        'New Comment on Your Proposal',
        `${req.user.name} commented on "${proposal.title}"`,
        id,
        userId
      );
    }

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`proposal_${id}`).emit('newComment', {
        commentId: result.insertId,
        proposalId: id,
        userId,
        userName: req.user.name,
        userRole: req.user.role,
        comment: comment.trim(),
        createdAt: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      commentId: result.insertId,
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  } finally {
    connection.release();
  }
}

/**
 * Update comment
 * PUT /proposals/:proposalId/comments/:commentId
 */
async function updateComment(req, res) {
  const connection = await pool.getConnection();

  try {
    const { proposalId, commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    // Verify comment exists and user owns it
    const [comments] = await connection.query(
      'SELECT id FROM proposal_comments WHERE id = ? AND proposal_id = ? AND user_id = ?',
      [commentId, proposalId, userId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found or you do not have permission to edit it' });
    }

    // Update comment
    await connection.query(
      'UPDATE proposal_comments SET comment = ?, updated_at = NOW() WHERE id = ?',
      [comment.trim(), commentId]
    );

    res.json({
      success: true,
      message: 'Comment updated successfully',
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  } finally {
    connection.release();
  }
}

/**
 * Delete comment
 * DELETE /proposals/:proposalId/comments/:commentId
 */
async function deleteComment(req, res) {
  const connection = await pool.getConnection();

  try {
    const { proposalId, commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify comment exists
    const [comments] = await connection.query(
      'SELECT user_id FROM proposal_comments WHERE id = ? AND proposal_id = ?',
      [commentId, proposalId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only comment owner or admin can delete
    if (comments[0].user_id !== userId && userRole !== 'DIRECTOR_SSC') {
      return res.status(403).json({ error: 'You do not have permission to delete this comment' });
    }

    // Delete comment
    await connection.query(
      'DELETE FROM proposal_comments WHERE id = ?',
      [commentId]
    );

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  } finally {
    connection.release();
  }
}

module.exports = {
  getComments,
  addComment,
  updateComment,
  deleteComment,
};
