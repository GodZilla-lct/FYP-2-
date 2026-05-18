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
 * Allows updating name, bio, and phone.
 * Email, roll_number, and role are always locked.
 */
async function updateProfile(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    
    // Extract only allowed fields — email/roll_number/role are always ignored
    const { name, bio, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ 
        error: 'Invalid name',
        message: 'Name is required and must be a non-empty string'
      });
    }

    const sanitizedName  = name.trim().substring(0, 255);
    const sanitizedBio   = bio   ? bio.trim().substring(0, 1000)  : null;
    const sanitizedPhone = phone ? phone.trim().substring(0, 20)  : null;

    const [result] = await connection.query(
      'UPDATE users SET name = ?, bio = ?, phone = ?, updated_at = NOW() WHERE id = ?',
      [sanitizedName, sanitizedBio, sanitizedPhone, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log any attempted unauthorized field updates
    const attemptedFields = Object.keys(req.body);
    const unauthorizedFields = attemptedFields.filter(f => !['name','bio','phone'].includes(f));
    if (unauthorizedFields.length > 0) {
      console.warn(`[SECURITY] User ${userId} attempted to update unauthorized fields: ${unauthorizedFields.join(', ')}`);
    }

    console.log(`[PROFILE UPDATE] User ${userId} updated profile`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: ['name', 'bio', 'phone'].filter(f => req.body[f] !== undefined)
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
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
 * - Returns 400 if current password is wrong
 * - Hashes new password with bcrypt (10 rounds)
 * - Logs password change for audit trail
 */
async function changePassword(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    console.log(`[PASSWORD CHANGE] User ${userId} (${req.user.role}) attempting password change`);

    // Validate input
    if (!currentPassword || !newPassword) {
      console.log(`[PASSWORD CHANGE] Missing fields for user ${userId}`);
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Both current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      console.log(`[PASSWORD CHANGE] Weak password for user ${userId}`);
      return res.status(400).json({ 
        error: 'Weak password',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Prevent using same password
    if (currentPassword === newPassword) {
      console.log(`[PASSWORD CHANGE] Same password attempt for user ${userId}`);
      return res.status(400).json({ 
        error: 'Invalid password',
        message: 'New password must be different from current password'
      });
    }

    // Fetch user from database
    const [users] = await connection.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      console.log(`[PASSWORD CHANGE] User ${userId} not found in database`);
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Your account could not be found'
      });
    }

    const user = users[0];

    // Check if password_hash field exists
    if (!user.password_hash) {
      console.error(`[PASSWORD CHANGE] User ${userId} has no password_hash in database`);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Password data is missing. Please contact support.'
      });
    }

    // CRITICAL SECURITY: Verify current password using bcrypt.compare
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    } catch (bcryptError) {
      console.error(`[PASSWORD CHANGE] bcrypt.compare error for user ${userId}:`, bcryptError);
      return res.status(500).json({ 
        error: 'Password verification error',
        message: 'Unable to verify password. Please try again.'
      });
    }

    if (!isPasswordValid) {
      console.warn(`[SECURITY] User ${userId} failed password verification`);
      return res.status(400).json({ 
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password with bcrypt (10 rounds)
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    } catch (bcryptError) {
      console.error(`[PASSWORD CHANGE] bcrypt.hash error for user ${userId}:`, bcryptError);
      return res.status(500).json({ 
        error: 'Password hashing error',
        message: 'Unable to hash new password. Please try again.'
      });
    }

    // Update password in database
    try {
      const [result] = await connection.query(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, userId]
      );
      
      if (result.affectedRows === 0) {
        console.error(`[PASSWORD CHANGE] Update affected 0 rows for user ${userId}`);
        return res.status(500).json({ 
          error: 'Update failed',
          message: 'Password update did not affect any rows'
        });
      }
      
      console.log(`[PASSWORD CHANGE] User ${userId} successfully changed password (${result.affectedRows} row(s) updated)`);
    } catch (dbError) {
      console.error(`[PASSWORD CHANGE] Database update error for user ${userId}:`, dbError);
      return res.status(500).json({ 
        error: 'Database update error',
        message: 'Unable to update password in database'
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('[PASSWORD CHANGE] Error:', error);
    console.error('[PASSWORD CHANGE] Error stack:', error.stack);
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
      `SELECT id, name, email, roll_number, role, profile_picture, bio,
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
