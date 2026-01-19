const pool = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Get all societies with their dynamic roles
 * GET /societies
 */
async function getSocieties(req, res) {
  const connection = await pool.getConnection();

  try {
    const [societies] = await connection.query(
      `SELECT s.id, s.name, s.coordinator_id, c.name as coordinator_name, c.roll_number as coordinator_roll
       FROM societies s
       LEFT JOIN users c ON s.coordinator_id = c.id
       ORDER BY s.name ASC`
    );

    // Get roles for each society
    for (let society of societies) {
      const [roles] = await connection.query(
        `SELECT sr.id, sr.role_name, sr.is_core_leader, u.name, u.roll_number
         FROM society_roles sr
         JOIN users u ON sr.user_id = u.id
         WHERE sr.society_id = ?
         ORDER BY sr.is_core_leader DESC, sr.role_name ASC`,
        [society.id]
      );
      society.roles = roles;
    }

    res.json({
      success: true,
      societies,
    });
  } catch (error) {
    console.error('Error fetching societies:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Add or update a role in a society
 * POST /societies/:id/roles
 * FIXED: Auto-create user if doesn't exist, handle text inputs
 */
async function addOrUpdateSocietyRole(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id: societyId } = req.params;
    const { studentName, rollNumber, roleName, isCoreLeader = false } = req.body;

    // Validate input
    if (!studentName || !rollNumber || !roleName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Student name, roll number, and role name are required'
      });
    }

    // Validate society exists
    const [societies] = await connection.query('SELECT id FROM societies WHERE id = ?', [societyId]);
    if (societies.length === 0) {
      return res.status(404).json({ error: 'Society not found' });
    }

    // Check if user exists by roll number
    let [users] = await connection.query('SELECT id FROM users WHERE roll_number = ?', [rollNumber]);
    let userId;

    if (users.length === 0) {
      // CRITICAL: Auto-create user if doesn't exist
      const email = `${rollNumber}@uog.edu.pk`;
      const defaultPassword = await bcrypt.hash('default', 10);

      const [result] = await connection.query(
        'INSERT INTO users (name, email, password_hash, roll_number, role) VALUES (?, ?, ?, ?, ?)',
        [studentName, email, defaultPassword, rollNumber, 'STUDENT']
      );
      userId = result.insertId;

      console.log(`Auto-created user: ${studentName} (${rollNumber}) with email: ${email}`);
    } else {
      userId = users[0].id;
      
      // Update user name if different
      await connection.query(
        'UPDATE users SET name = ? WHERE id = ?',
        [studentName, userId]
      );
    }

    // Check if role already exists for this user in this society
    const [existingRoles] = await connection.query(
      'SELECT id FROM society_roles WHERE society_id = ? AND user_id = ? AND role_name = ?',
      [societyId, userId, roleName]
    );

    if (existingRoles.length > 0) {
      // Update existing role
      await connection.query(
        'UPDATE society_roles SET is_core_leader = ? WHERE id = ?',
        [isCoreLeader, existingRoles[0].id]
      );
    } else {
      // Create new role
      await connection.query(
        'INSERT INTO society_roles (society_id, user_id, role_name, is_core_leader) VALUES (?, ?, ?, ?)',
        [societyId, userId, roleName, isCoreLeader]
      );
    }

    res.json({
      success: true,
      message: 'Role added/updated successfully',
      user: {
        id: userId,
        name: studentName,
        roll_number: rollNumber,
        role_name: roleName,
        is_core_leader: isCoreLeader
      }
    });

  } catch (error) {
    console.error('Error adding/updating society role:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Duplicate entry',
        details: 'This role assignment already exists'
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Remove a role from a society
 * DELETE /societies/:societyId/roles/:roleId
 */
async function removeSocietyRole(req, res) {
  const connection = await pool.getConnection();

  try {
    const { societyId, roleId } = req.params;

    // Verify role exists and belongs to the society
    const [roles] = await connection.query(
      'SELECT id FROM society_roles WHERE id = ? AND society_id = ?',
      [roleId, societyId]
    );

    if (roles.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Delete the role
    await connection.query('DELETE FROM society_roles WHERE id = ?', [roleId]);

    res.json({
      success: true,
      message: 'Role removed successfully'
    });

  } catch (error) {
    console.error('Error removing society role:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Update society coordinator
 * PUT /societies/:id/coordinator
 */
async function updateSocietyCoordinator(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id: societyId } = req.params;
    const { coordinatorId } = req.body;

    // Validate society exists
    const [societies] = await connection.query('SELECT id FROM societies WHERE id = ?', [societyId]);
    if (societies.length === 0) {
      return res.status(404).json({ error: 'Society not found' });
    }

    // Validate coordinator if provided
    if (coordinatorId) {
      const [coordinators] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [coordinatorId, 'COORDINATOR']
      );
      if (coordinators.length === 0) {
        return res.status(400).json({ error: 'Invalid coordinator ID' });
      }
    }

    // Update society
    await connection.query(
      'UPDATE societies SET coordinator_id = ? WHERE id = ?',
      [coordinatorId || null, societyId]
    );

    res.json({
      success: true,
      message: 'Coordinator updated successfully'
    });

  } catch (error) {
    console.error('Error updating coordinator:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Get users by role for dropdowns
 * GET /users/by-role/:role
 */
async function getUsersByRole(req, res) {
  const connection = await pool.getConnection();

  try {
    const { role } = req.params;
    
    const [users] = await connection.query(
      'SELECT id, name, email, roll_number FROM users WHERE role = ? ORDER BY name ASC',
      [role]
    );

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

module.exports = {
  getSocieties,
  addOrUpdateSocietyRole,
  removeSocietyRole,
  updateSocietyCoordinator,
  getUsersByRole
};