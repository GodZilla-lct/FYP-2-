const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateAccessToken } = require('../config/jwt');

/**
 * Log Super Admin Action
 * Helper function to log all super admin actions
 */
async function logSuperAdminAction(connection, adminId, actionType, description, metadata = {}) {
  try {
    await connection.query(
      `INSERT INTO super_admin_logs (admin_id, action_type, description, target_user_id, target_proposal_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        actionType,
        description,
        metadata.targetUserId || null,
        metadata.targetProposalId || null,
        JSON.stringify(metadata)
      ]
    );
    console.log(`[SUPER_ADMIN] ${actionType}: ${description}`);
  } catch (error) {
    console.error('[SUPER_ADMIN] Failed to log action:', error);
    // Don't throw - logging failure shouldn't break the operation
  }
}

/**
 * Force Proposal Status (BYPASS WORKFLOW)
 * PUT /api/super/proposals/:id/force-status
 * Takes { "newStatus": "APPROVED" } and updates directly
 */
async function forceProposalStatus(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { newStatus } = req.body;
    const adminId = req.user.id;

    console.log('[SUPER_ADMIN] Force status change request:', { proposalId: id, newStatus, adminId });

    // Validate status - ALL 9 SYSTEM STATUSES
    const validStatuses = [
      'PENDING_COORDINATOR',
      'PENDING_DIRECTOR_SSC',
      'PENDING_ASST_DIRECTOR',
      'PENDING_FINANCE_SECRETARY',
      'PENDING_REGISTRAR',
      'PENDING_VC',
      'APPROVED',
      'RETURNED_FOR_REVISION',
      'REJECTED'
    ];

    if (!validStatuses.includes(newStatus)) {
      console.log('[SUPER_ADMIN] Invalid status provided:', newStatus);
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }

    // Get proposal
    const [proposals] = await connection.query(
      'SELECT * FROM proposals WHERE id = ?',
      [id]
    );

    if (proposals.length === 0) {
      console.log('[SUPER_ADMIN] Proposal not found:', id);
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposals[0];
    const oldStatus = proposal.current_status;

    console.log('[SUPER_ADMIN] Changing status from', oldStatus, 'to', newStatus);

    // Force update proposal status (bypass workflow)
    await connection.query(
      'UPDATE proposals SET current_status = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );

    // Insert into approval history with FORCE_STATUS_CHANGE action
    await connection.query(
      `INSERT INTO approval_history (proposal_id, approver_id, action, comments, created_at)
       VALUES (?, ?, 'FORCE_STATUS_CHANGE', ?, NOW())`,
      [id, adminId, `Force changed from ${oldStatus} to ${newStatus} by System Admin`]
    );

    // Log action
    await logSuperAdminAction(
      connection,
      adminId,
      'FORCE_STATUS_CHANGE',
      `Force changed proposal #${id} from ${oldStatus} to ${newStatus}`,
      { targetProposalId: id, oldStatus, newStatus }
    );

    // ── Email notifications for every force status change ──────────────────
    try {
      const { sendStandardNotification, sendVCMagicLink } = require('../utils/emailService');
      const { createNotification } = require('./notificationController');

      // 1. Always notify the proposal creator about the status change
      const [creatorRows] = await connection.query(
        'SELECT name, email FROM users WHERE id = ?',
        [proposal.user_id]
      );

      if (creatorRows.length > 0) {
        const creator = creatorRows[0];

        // In-app notification
        await createNotification(
          proposal.user_id,
          'PROPOSAL_STATUS',
          'Proposal Status Updated',
          `Your proposal "${proposal.title}" status was changed to ${newStatus} by System Admin`,
          parseInt(id),
          adminId
        );

        // Email notification
        await sendStandardNotification(creator.email, creator.name);
        console.log(`[EMAIL] Status change notification sent to ${creator.email} (${newStatus})`);
      }

      // 2. If forced to PENDING_VC → send VC Magic Link
      if (newStatus === 'PENDING_VC') {
        const jwt = require('jsonwebtoken');

        const magicToken = jwt.sign(
          { proposalId: parseInt(id), role: 'VC' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        const [proposalDetails] = await connection.query(
          `SELECT p.*, s.name as society_name
           FROM proposals p
           JOIN societies s ON p.society_id = s.id
           WHERE p.id = ?`,
          [id]
        );

        if (proposalDetails.length > 0) {
          const vcEmail = process.env.VC_EMAIL || 'vc@uog.edu.pk';
          await sendVCMagicLink(vcEmail, proposalDetails[0], magicToken);
          console.log(`[EMAIL] VC Magic Link sent to ${vcEmail} for proposal #${id}`);
        }
      }

      // 3. If forced to APPROVED → also notify the next relevant admin
      //    (so they know the proposal was approved out-of-band)
      if (newStatus === 'APPROVED') {
        const [directorRows] = await connection.query(
          "SELECT name, email FROM users WHERE role = 'DIRECTOR_SSC' AND is_active = TRUE LIMIT 1"
        );
        if (directorRows.length > 0) {
          await sendStandardNotification(directorRows[0].email, directorRows[0].name);
          console.log(`[EMAIL] Approval notification sent to Director SSC ${directorRows[0].email}`);
        }
      }

    } catch (emailError) {
      console.error('[EMAIL] Failed to send force-status notifications:', emailError.message);
      // Non-blocking — status is already updated
    }

    console.log('[SUPER_ADMIN] Status change successful');

    res.json({
      success: true,
      message: `Proposal status force changed to ${newStatus}`,
      proposalId: id,
      oldStatus,
      newStatus
    });

  } catch (error) {
    console.error('[SUPER_ADMIN] Force status change error:', error);
    console.error('[SUPER_ADMIN] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to force change proposal status',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  } finally {
    connection.release();
  }
}

/**
 * Force Password Reset (NO OLD PASSWORD REQUIRED)
 * PUT /api/super/users/:id/force-password
 * Takes { "newPassword": "str" } and updates directly
 */
async function forcePasswordReset(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Get user
    const [users] = await connection.query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password (force, no old password check)
    await connection.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, id]
    );

    // Log action
    await logSuperAdminAction(
      connection,
      adminId,
      'FORCE_PASSWORD_RESET',
      `Force reset password for user ${user.name} (${user.email})`,
      { targetUserId: id }
    );

    res.json({
      success: true,
      message: 'Password force reset successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Force password reset error:', error);
    res.status(500).json({ error: 'Failed to force reset password' });
  } finally {
    connection.release();
  }
}

/**
 * Role Management - Update User Role
 * PUT /api/super/users/:id/role
 * Changes user's role
 */
async function updateUserRole(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { newRole } = req.body;
    const adminId = req.user.id;

    // Validate role
    const validRoles = [
      'STUDENT',
      'COORDINATOR',
      'DIRECTOR_SSC',
      'ASST_DIRECTOR',
      'FINANCE_SECRETARY',
      'REGISTRAR',
      'VC',
      'SYSTEM_ADMIN'
    ];

    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Get user
    const [users] = await connection.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const oldRole = user.role;

    // Update role
    await connection.query(
      'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
      [newRole, id]
    );

    // Log action
    await logSuperAdminAction(
      connection,
      adminId,
      'ROLE_CHANGE',
      `Changed role for ${user.name} from ${oldRole} to ${newRole}`,
      { targetUserId: id, oldRole, newRole }
    );

    res.json({
      success: true,
      message: `User role updated to ${newRole}`,
      oldRole,
      newRole,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  } finally {
    await connection.release();
  }
}

/**
 * Academic Year Reset (Rollover)
 * POST /api/super/system/rollover
 * Archives proposals, resets budgets, demotes society leaders
 */
async function executeAcademicYearReset(req, res) {
  const connection = await pool.getConnection();

  try {
    const adminId = req.user.id;

    await connection.beginTransaction();

    // Step 1: Archive all proposals
    const [archiveResult] = await connection.query(
      'UPDATE proposals SET is_archived = TRUE WHERE is_archived = FALSE'
    );
    const archivedCount = archiveResult.affectedRows;

    // Step 2: Reset society budgets
    const [budgetResult] = await connection.query(
      'UPDATE societies SET budget_allocated = 0, budget_spent = 0'
    );
    const societiesReset = budgetResult.affectedRows;

    // Step 3: Demote society leaders to students (preserve admin roles)
    const [roleResult] = await connection.query(
      `UPDATE users SET role = 'STUDENT' 
       WHERE role NOT IN ('COORDINATOR', 'DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC', 'SYSTEM_ADMIN')`
    );
    const usersReset = roleResult.affectedRows;

    await connection.commit();

    // Log action
    await logSuperAdminAction(
      connection,
      adminId,
      'ACADEMIC_YEAR_RESET',
      `Executed academic year rollover: ${archivedCount} proposals archived, ${societiesReset} societies reset, ${usersReset} users demoted`,
      { archivedCount, societiesReset, usersReset }
    );

    res.json({
      success: true,
      message: 'Academic year reset completed successfully',
      stats: {
        proposalsArchived: archivedCount,
        societiesReset: societiesReset,
        usersReset: usersReset
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Academic year reset error:', error);
    res.status(500).json({ error: 'Failed to execute academic year reset' });
  } finally {
    await connection.release();
  }
}

/**
 * Global Kill Switch & Announcements
 * PUT /api/super/system/settings
 * Updates system-wide settings
 */
async function updateSystemSettings(req, res) {
  const connection = await pool.getConnection();

  try {
    const { freeze, announcement, color } = req.body;
    const adminId = req.user.id;

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (typeof freeze === 'boolean') {
      updates.push('global_freeze = ?');
      values.push(freeze);
    }

    if (announcement !== undefined) {
      updates.push('announcement_text = ?');
      values.push(announcement || null);
    }

    if (color) {
      updates.push('announcement_color = ?');
      values.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No settings to update' });
    }

    // Update settings
    await connection.query(
      `UPDATE system_settings SET ${updates.join(', ')}, updated_at = NOW() WHERE id = 1`,
      values
    );

    // Get updated settings
    const [settings] = await connection.query(
      'SELECT * FROM system_settings WHERE id = 1'
    );

    // Log action
    await logSuperAdminAction(
      connection,
      adminId,
      'SYSTEM_SETTINGS_UPDATE',
      `Updated system settings: freeze=${freeze}, announcement="${announcement}"`,
      { freeze, announcement, color }
    );

    res.json({
      success: true,
      message: 'System settings updated successfully',
      settings: settings[0]
    });

  } catch (error) {
    console.error('System settings update error:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  } finally {
    await connection.release();
  }
}

/**
 * Get System Settings
 * GET /api/system/settings
 * Public endpoint to check system status
 */
async function getSystemSettings(req, res) {
  const connection = await pool.getConnection();

  try {
    const [settings] = await connection.query(
      'SELECT * FROM system_settings WHERE id = 1'
    );

    if (settings.length === 0) {
      return res.json({
        global_freeze: false,
        announcement_text: null,
        announcement_color: 'bg-blue-500'
      });
    }

    res.json(settings[0]);

  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  } finally {
    await connection.release();
  }
}

/**
 * Ghost Mode - Impersonate User
 * POST /api/super/impersonate/:id
 * Generates JWT for target user
 */
async function impersonateUser(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Get target user
    const [users] = await connection.query(
      'SELECT id, name, email, role, roll_number, COALESCE(session_version, 0) AS session_version FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    const targetUser = users[0];

    // Generate new JWT for target user (using same method as authController)
    const token = generateAccessToken(targetUser);

    // Log action
    await logSuperAdminAction(
      connection,
      adminId,
      'IMPERSONATE',
      `Impersonated user ${targetUser.name} (${targetUser.email})`,
      { targetUserId: id }
    );

    res.json({
      success: true,
      message: `Impersonating ${targetUser.name}`,
      token,
      accessToken: token,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        rollNumber: targetUser.roll_number || null,
      }
    });

  } catch (error) {
    console.error('Impersonate error:', error);
    res.status(500).json({ error: 'Failed to impersonate user' });
  } finally {
    await connection.release();
  }
}

/**
 * Get All Users (for management)
 * GET /api/super/users
 */
async function getAllUsers(req, res) {
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query(
      `SELECT id, name, email, role, roll_number, is_active, created_at, last_login
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  } finally {
    await connection.release();
  }
}

/**
 * Get All Proposals (including archived)
 * GET /api/super/proposals
 */
async function getAllProposals(req, res) {
  const connection = await pool.getConnection();

  try {
    const [proposals] = await connection.query(
      `SELECT 
        p.*,
        s.name as society_name,
        u.name as created_by_name,
        u.email as created_by_email
       FROM proposals p
       JOIN societies s ON p.society_id = s.id
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      proposals
    });

  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  } finally {
    await connection.release();
  }
}

/**
 * Get Super Admin Logs
 * GET /api/super/logs
 */
async function getSuperAdminLogs(req, res) {
  const connection = await pool.getConnection();

  try {
    const { limit = 100 } = req.query;

    const [logs] = await connection.query(
      `SELECT 
        sal.*,
        u.name as admin_name,
        u.email as admin_email
       FROM super_admin_logs sal
       JOIN users u ON sal.admin_id = u.id
       ORDER BY sal.timestamp DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      logs
    });

  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  } finally {
    await connection.release();
  }
}

module.exports = {
  forceProposalStatus,
  forcePasswordReset,
  updateUserRole,
  executeAcademicYearReset,
  updateSystemSettings,
  getSystemSettings,
  impersonateUser,
  getAllUsers,
  getAllProposals,
  getSuperAdminLogs
};
