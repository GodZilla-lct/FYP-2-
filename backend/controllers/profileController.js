const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;

/**
 * MODULE 1: THE SECURE PROFILE SYSTEM
 * Locked-down profile management with avatar uploads and secure password changes
 */

/**
 * Upload Avatar
 * POST /api/profile/avatar
 * 
 * SECURITY:
 * - Only authenticated users can upload
 * - File type validation (images only)
 * - File size limit (5MB)
 * - Stores in /uploads/avatars/
 */
async function uploadAvatar(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select an image file to upload'
      });
    }

    // Validate file type (additional check beyond multer)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      // Delete uploaded file
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ 
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, and GIF images are allowed'
      });
    }

    // Generate profile picture URL
    const profilePictureUrl = `/uploads/avatars/${req.file.filename}`;

    // Get old profile picture to delete it
    const [users] = await connection.query(
      'SELECT profile_picture FROM users WHERE id = ?',
      [userId]
    );

    const oldPicture = users[0]?.profile_picture;

    // Update database with new profile picture
    await connection.query(
      'UPDATE users SET profile_picture = ?, updated_at = NOW() WHERE id = ?',
      [profilePictureUrl, userId]
    );

    // Delete old profile picture file if it exists
    if (oldPicture && oldPicture.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(__dirname, '../../', oldPicture);
      await fs.unlink(oldFilePath).catch(() => {
        // Ignore errors if file doesn't exist
      });
    }

    console.log(`[AVATAR UPLOAD] User ${userId} uploaded new avatar: ${req.file.filename}`);

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureUrl,
      fileSize: req.file.size,
      fileName: req.file.filename
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ 
      error: 'Failed to upload avatar',
      message: 'An error occurred while uploading your profile picture'
    });
  } finally {
    connection.release();
  }
}

/**
 * Update Profile Details
 * PUT /api/profile/update
 * 
 * SECURITY:
 * - ONLY allows updating 'name' field
 * - Explicitly strips out email, bio, roll_number, role
 * - Prevents privilege escalation and account takeover
 */
async function updateProfile(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    
    // CRITICAL SECURITY: Extract ONLY the 'name' field
    // Even if frontend sends email, bio, roll_number, role, etc., they will be IGNORED
    const { name } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ 
        error: 'Invalid name',
        message: 'Name is required and must be a non-empty string'
      });
    }

    // Sanitize name (trim whitespace, limit length)
    const sanitizedName = name.trim().substring(0, 255);

    // Update ONLY the name field
    const [result] = await connection.query(
      'UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?',
      [sanitizedName, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Your profile could not be found'
      });
    }

    console.log(`[PROFILE UPDATE] User ${userId} updated name to: ${sanitizedName}`);

    // Log any attempted unauthorized field updates
    const attemptedFields = Object.keys(req.body);
    const unauthorizedFields = attemptedFields.filter(f => f !== 'name');
    if (unauthorizedFields.length > 0) {
      console.warn(`[SECURITY] User ${userId} attempted to update unauthorized fields: ${unauthorizedFields.join(', ')}`);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: ['name']
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      message: 'An error occurred while updating your profile'
    });
  } finally {
    connection.release();
  }
}

/**
 * Change Password (Secure)
 * PUT /api/profile/change-password
 * 
 * SECURITY:
 * - Requires current password verification
 * - Uses bcrypt.compare for strict validation
 * - Returns 401 if current password is wrong
 * - Hashes new password with bcrypt (10 rounds)
 * - Logs password change for audit trail
 */
async function changePassword(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Both current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Weak password',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Prevent using same password
    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        error: 'Invalid password',
        message: 'New password must be different from current password'
      });
    }

    // Fetch user from database
    const [users] = await connection.query(
      'SELECT id, password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Your account could not be found'
      });
    }

    const user = users[0];

    // CRITICAL SECURITY: Verify current password using bcrypt.compare
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      console.warn(`[SECURITY] User ${userId} failed password verification`);
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await connection.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    console.log(`[PASSWORD CHANGE] User ${userId} successfully changed password`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password',
      message: 'An error occurred while changing your password'
    });
  } finally {
    connection.release();
  }
}

/**
 * Get Profile
 * GET /api/profile
 * 
 * Returns current user's profile with all details
 */
async function getProfile(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    // Fetch user profile
    const [users] = await connection.query(
      `SELECT id, name, email, roll_number, role, profile_picture, 
              phone, is_active, created_at, last_login
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
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  } finally {
    connection.release();
  }
}

module.exports = {
  uploadAvatar,
  updateProfile,
  changePassword,
  getProfile
};
