const pool = require('../config/database');

/**
 * Get user notifications
 * GET /notifications
 */
async function getNotifications(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const { unreadOnly = false, limit = 50 } = req.query;

    let query = `
      SELECT n.*, u.name as sender_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = ?
    `;

    const params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND n.is_read = FALSE';
    }

    query += ' ORDER BY n.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [notifications] = await connection.query(query, params);

    // Get unread count
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      notifications,
      unreadCount: countResult[0].unread_count,
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  } finally {
    connection.release();
  }
}

/**
 * Mark notification as read
 * PUT /notifications/:id/read
 */
async function markAsRead(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    await connection.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Notification marked as read',
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  } finally {
    connection.release();
  }
}

/**
 * Mark all notifications as read
 * PUT /notifications/read-all
 */
async function markAllAsRead(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    await connection.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  } finally {
    connection.release();
  }
}

/**
 * Delete notification
 * DELETE /notifications/:id
 */
async function deleteNotification(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    await connection.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Notification deleted',
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  } finally {
    connection.release();
  }
}

/**
 * Create notification (internal use)
 */
async function createNotification(userId, type, title, message, relatedId = null, senderId = null) {
  const connection = await pool.getConnection();

  try {
    const [result] = await connection.query(
      'INSERT INTO notifications (user_id, type, title, message, related_id, sender_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, title, message, relatedId, senderId]
    );

    // Emit real-time notification via Socket.IO
    try {
      const { emitToUser } = require('../config/socket');
      emitToUser(userId, 'notification', {
        id: result.insertId,
        type,
        title,
        message,
        related_id: relatedId,
        sender_id: senderId,
        is_read: false,
        created_at: new Date().toISOString()
      });
    } catch (socketErr) {
      // Socket not initialized yet or user not connected — that's fine
      console.warn('[SOCKET] Could not emit notification:', socketErr.message);
    }

    return { success: true, notificationId: result.insertId };

  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get notification preferences
 * GET /notifications/preferences
 */
async function getNotificationPreferences(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    const [prefs] = await connection.query(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [userId]
    );

    if (prefs.length === 0) {
      // Return default preferences
      return res.json({
        success: true,
        preferences: {
          email_notifications: true,
          push_notifications: true,
          proposal_status_change: true,
          new_comment: true,
          assignment_notification: true,
        },
      });
    }

    res.json({
      success: true,
      preferences: prefs[0],
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  } finally {
    connection.release();
  }
}

/**
 * Update notification preferences
 * PUT /notifications/preferences
 */
async function updateNotificationPreferences(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const preferences = req.body;

    // Check if preferences exist
    const [existing] = await connection.query(
      'SELECT id FROM notification_preferences WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Insert new preferences
      await connection.query(
        'INSERT INTO notification_preferences (user_id, email_notifications, push_notifications, proposal_status_change, new_comment, assignment_notification) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, preferences.email_notifications, preferences.push_notifications, preferences.proposal_status_change, preferences.new_comment, preferences.assignment_notification]
      );
    } else {
      // Update existing preferences
      await connection.query(
        'UPDATE notification_preferences SET ? WHERE user_id = ?',
        [preferences, userId]
      );
    }

    res.json({
      success: true,
      message: 'Notification preferences updated',
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  } finally {
    connection.release();
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
};
