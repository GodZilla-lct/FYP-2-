const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

/**
 * Get user profile
 * GET /users/:id
 */
/**
 * Get user profile (authenticated user's own profile)
 * GET /users/profile
 */
async function getUserProfile(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id; // Get from JWT token

    // V3 schema compatible - only select columns that exist
    const [users] = await connection.query(
      `SELECT id, name, email, roll_number, role, is_active, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get society roles
    const [societyRoles] = await connection.query(
      `SELECT s.id as society_id, s.name as society_name, sr.role_name, sr.is_core_leader
       FROM society_roles sr
       JOIN societies s ON sr.society_id = s.id
       WHERE sr.user_id = ?`,
      [userId]
    );

    // Get activity stats
    const [proposalStats] = await connection.query(
      'SELECT COUNT(*) as total_proposals FROM proposals WHERE user_id = ?',
      [userId]
    );

    const [approvalStats] = await connection.query(
      'SELECT COUNT(*) as total_approvals FROM approval_history WHERE approver_id = ?',
      [userId]
    );

    res.json({
      success: true,
      user: {
        ...user,
        societyRoles,
        stats: {
          totalProposals: proposalStats[0].total_proposals,
          totalApprovals: approvalStats[0].total_approvals,
        },
      },
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  } finally {
    connection.release();
  }
}

/**
 * Update user profile
 * PUT /users/:id
 */
/**
 * Update user profile (authenticated user only)
 * PUT /users/profile
 * SECURITY: Prevents role/email spoofing by stripping protected fields
 * V3 SCHEMA: Only updates 'name' field
 */
async function updateUserProfile(req, res) {
  const connection = await pool.getConnection();

  try {
    const requesterId = req.user.id; // From JWT token
    
    // SECURITY: Extract ONLY allowed fields from request body
    // V3 SCHEMA: Only 'name' exists and is editable
    const { name } = req.body;

    // CRITICAL: Explicitly ignore dangerous fields that users might try to modify
    // Even if sent in request, these will NEVER be updated:
    // - role (privilege escalation attack)
    // - email (account takeover)
    // - roll_number (student ID manipulation)
    // - society_id (unauthorized society access)
    // - is_active (account status manipulation)
    // - password_hash (direct password manipulation)
    
    const updateData = {};
    
    // Only allow 'name' field update
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim();
    }

    // Validate at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: 'No valid fields to update',
        message: 'Please provide name to update'
      });
    }

    // Update only the authenticated user's profile
    const [result] = await connection.query(
      'UPDATE users SET ? WHERE id = ?',
      [updateData, requesterId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Your profile could not be found'
      });
    }

    // Log the profile update for audit trail
    console.log(`[PROFILE UPDATE] User ${requesterId} updated profile:`, Object.keys(updateData));

    res.json({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: Object.keys(updateData),
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      message: 'An error occurred while updating your profile'
    });
  } finally {
    connection.release();
  }
}

/**
 * Upload profile picture
 * POST /users/:id/profile-picture
 */
async function uploadProfilePicture(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const requesterId = req.user.id;

    if (parseInt(id) !== requesterId) {
      return res.status(403).json({ error: 'You can only update your own profile picture' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    await connection.query(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [profilePictureUrl, id]
    );

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureUrl,
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  } finally {
    connection.release();
  }
}

/**
 * Get user activity log
 * GET /users/:id/activity
 */
async function getUserActivity(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    // Users can only view their own activity unless they're admin
    if (parseInt(id) !== requesterId && !['DIRECTOR_SSC', 'ASST_DIRECTOR'].includes(requesterRole)) {
      return res.status(403).json({ error: 'You can only view your own activity' });
    }

    // Get proposal activity
    const [proposals] = await connection.query(
      `SELECT 'PROPOSAL_CREATED' as type, p.id as related_id, p.title as description, p.created_at as timestamp
       FROM proposals p
       WHERE p.user_id = ?
       UNION ALL
       SELECT 'APPROVAL_ACTION' as type, ah.proposal_id as related_id, 
              CONCAT(ah.action, ' - ', p.title) as description, ah.created_at as timestamp
       FROM approval_history ah
       JOIN proposals p ON ah.proposal_id = p.id
       WHERE ah.approver_id = ?
       UNION ALL
       SELECT 'COMMENT_ADDED' as type, pc.proposal_id as related_id,
              CONCAT('Commented on ', p.title) as description, pc.created_at as timestamp
       FROM proposal_comments pc
       JOIN proposals p ON pc.proposal_id = p.id
       WHERE pc.user_id = ?
       ORDER BY timestamp DESC
       LIMIT 50`,
      [id, id, id]
    );

    res.json({
      success: true,
      activity: proposals,
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  } finally {
    connection.release();
  }
}

/**
 * Deactivate user (Admin only)
 * PUT /users/:id/deactivate
 */
async function deactivateUser(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.query(
      'UPDATE users SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  } finally {
    connection.release();
  }
}

/**
 * Reactivate user (Admin only)
 * PUT /users/:id/reactivate
 */
async function reactivateUser(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.query(
      'UPDATE users SET is_active = TRUE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'User reactivated successfully',
    });

  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ error: 'Failed to reactivate user' });
  } finally {
    connection.release();
  }
}

/**
 * Bulk import users from CSV
 * POST /users/bulk-import
 */
async function bulkImportUsers(req, res) {
  const connection = await pool.getConnection();

  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Users array is required' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const userData of users) {
      try {
        const { name, email, rollNumber, role = 'STUDENT' } = userData;

        // Validate required fields
        if (!name || !email || !rollNumber) {
          results.failed++;
          results.errors.push({ email, error: 'Missing required fields' });
          continue;
        }

        // Check if user exists
        const [existing] = await connection.query(
          'SELECT id FROM users WHERE email = ? OR roll_number = ?',
          [email, rollNumber]
        );

        if (existing.length > 0) {
          results.failed++;
          results.errors.push({ email, error: 'User already exists' });
          continue;
        }

        // Create user with default password
        const defaultPassword = await bcrypt.hash('default123', 10);

        await connection.query(
          'INSERT INTO users (name, email, password_hash, roll_number, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [name, email, defaultPassword, rollNumber, role, true]
        );

        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push({ email: userData.email, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Imported ${results.success} users, ${results.failed} failed`,
      results,
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Bulk import failed' });
  } finally {
    connection.release();
  }
}

/**
 * Create a Coordinator account (DIRECTOR_SSC and SYSTEM_ADMIN only)
 * POST /users/coordinators
 */
async function createCoordinator(req, res) {
  const connection = await pool.getConnection();

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, email, and password are all required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check for duplicate email
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // roll_number is NULL for admin/coordinator accounts
    const [result] = await connection.query(
      `INSERT INTO users (name, email, password_hash, roll_number, role, is_active)
       VALUES (?, ?, ?, NULL, 'COORDINATOR', TRUE)`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    console.log(`[CREATE COORDINATOR] Created coordinator account: ${email} (ID: ${result.insertId})`);

    res.status(201).json({
      success: true,
      message: `Coordinator account created for ${name}`,
      coordinator: {
        id: result.insertId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'COORDINATOR'
      }
    });

  } catch (error) {
    console.error('Create coordinator error:', error);
    res.status(500).json({ error: 'Failed to create coordinator account' });
  } finally {
    connection.release();
  }
}

/**
 * Get all coordinators (for management view)
 * GET /users/coordinators
 */
async function getAllCoordinatorUsers(req, res) {
  const connection = await pool.getConnection();

  try {
    const [coordinators] = await connection.query(
      `SELECT 
        u.id, u.name, u.email, u.roll_number, u.is_active, u.created_at,
        s.id as society_id, s.name as society_name
       FROM users u
       LEFT JOIN societies s ON s.coordinator_id = u.id
       WHERE u.role = 'COORDINATOR'
       ORDER BY u.name`
    );

    res.json({ success: true, coordinators });

  } catch (error) {
    console.error('Get coordinators error:', error);
    res.status(500).json({ error: 'Failed to fetch coordinators' });
  } finally {
    connection.release();
  }
}

/**
 * Update a Coordinator's name and email (DIRECTOR_SSC and SYSTEM_ADMIN only)
 * PUT /users/coordinators/:id
 */
async function updateCoordinator(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ error: 'Provide at least name or email to update' });
    }

    // Verify the user exists and is a COORDINATOR
    const [users] = await connection.query(
      "SELECT id, name, email FROM users WHERE id = ? AND role = 'COORDINATOR'",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Coordinator not found' });
    }

    // Check email uniqueness if changing email
    if (email && email !== users[0].email) {
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email.toLowerCase().trim(), id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (email) {
      updates.push('email = ?');
      values.push(email.toLowerCase().trim());
    }

    values.push(id);

    await connection.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    console.log(`[UPDATE COORDINATOR] Updated coordinator ID ${id}: ${updates.join(', ')}`);

    res.json({
      success: true,
      message: 'Coordinator updated successfully',
      coordinator: {
        id: parseInt(id),
        name: name ? name.trim() : users[0].name,
        email: email ? email.toLowerCase().trim() : users[0].email
      }
    });

  } catch (error) {
    console.error('Update coordinator error:', error);
    res.status(500).json({ error: 'Failed to update coordinator' });
  } finally {
    connection.release();
  }
}
async function deleteCoordinator(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    // Check coordinator exists
    const [users] = await connection.query(
      "SELECT id, name FROM users WHERE id = ? AND role = 'COORDINATOR'",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Coordinator not found' });
    }

    // Remove from any assigned societies first
    await connection.query(
      'UPDATE societies SET coordinator_id = NULL WHERE coordinator_id = ?',
      [id]
    );

    // Deactivate the account (don't hard delete — preserve history)
    await connection.query(
      'UPDATE users SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `Coordinator ${users[0].name} has been deactivated and unassigned from all societies`
    });

  } catch (error) {
    console.error('Delete coordinator error:', error);
    res.status(500).json({ error: 'Failed to delete coordinator' });
  } finally {
    connection.release();
  }
}
async function getUserDashboard(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const dashboardData = {
      user: req.user,
      stats: {},
      recentActivity: [],
      pendingActions: [],
    };

    // Get user stats
    if (userRole === 'STUDENT' || req.user.canAccessSocietyDashboard) {
      const [proposalStats] = await connection.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN current_status LIKE 'PENDING%' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN current_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN current_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
         FROM proposals WHERE user_id = ?`,
        [userId]
      );
      dashboardData.stats.proposals = proposalStats[0];

      const [draftCount] = await connection.query(
        'SELECT COUNT(*) as count FROM draft_proposals WHERE user_id = ?',
        [userId]
      );
      dashboardData.stats.drafts = draftCount[0].count;
    }

    // Get pending actions for admins
    if (['COORDINATOR', 'DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'].includes(userRole)) {
      const statusMap = {
        'COORDINATOR': 'PENDING_COORDINATOR',
        'DIRECTOR_SSC': 'PENDING_DIRECTOR_SSC',
        'ASST_DIRECTOR': 'PENDING_ASST_DIRECTOR',
        'FINANCE_SECRETARY': 'PENDING_FINANCE_SECRETARY',
        'REGISTRAR': 'PENDING_REGISTRAR',
        'VC': 'PENDING_VC',
      };

      const [pendingProposals] = await connection.query(
        `SELECT COUNT(*) as count FROM proposals WHERE current_status = ?`,
        [statusMap[userRole]]
      );
      dashboardData.pendingActions.push({
        type: 'PROPOSALS_TO_REVIEW',
        count: pendingProposals[0].count,
      });
    }

    // Get recent activity
    const [recentActivity] = await connection.query(
      `SELECT 'PROPOSAL' as type, id, title as description, created_at as timestamp
       FROM proposals WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    dashboardData.recentActivity = recentActivity;

    // Get unread notifications count
    const [unreadNotifications] = await connection.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    dashboardData.stats.unreadNotifications = unreadNotifications[0].count;

    res.json({
      success: true,
      dashboard: dashboardData,
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  } finally {
    connection.release();
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  getUserActivity,
  deactivateUser,
  reactivateUser,
  bulkImportUsers,
  getUserDashboard,
  createCoordinator,
  getAllCoordinatorUsers,
  updateCoordinator,
  deleteCoordinator,
};
