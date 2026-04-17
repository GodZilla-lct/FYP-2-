/**
 * Cabinet Controller
 * Handles Society Cabinet ledger operations (historical records only)
 * 
 * IMPORTANT: This module is completely isolated from user authentication.
 * Cabinet members listed here do NOT receive portal access or login credentials.
 */

const pool = require('../config/database');

/**
 * Helper: Check if user is a society leader (core leader in society_roles)
 */
async function isSocietyLeader(userId, societyId) {
  const connection = await pool.getConnection();
  try {
    const [roles] = await connection.query(
      `SELECT id FROM society_roles 
       WHERE user_id = ? AND society_id = ? AND is_core_leader = TRUE`,
      [userId, societyId]
    );
    return roles.length > 0;
  } finally {
    connection.release();
  }
}

/**
 * Helper: Check if user is coordinator of a society
 */
async function isSocietyCoordinator(userId, societyId) {
  const connection = await pool.getConnection();
  try {
    const [societies] = await connection.query(
      `SELECT id FROM societies WHERE id = ? AND coordinator_id = ?`,
      [societyId, userId]
    );
    return societies.length > 0;
  } finally {
    connection.release();
  }
}

/**
 * POST /api/cabinet/add
 * Add a new cabinet member to the historical ledger
 * 
 * Authorization: Society Leaders (core_leader) or Coordinators only
 * Body: { society_id, student_name, roll_number, custom_role_title, academic_year }
 */
const addCabinetMember = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { society_id, student_name, roll_number, custom_role_title, academic_year } = req.body;
    const userId = req.user.id;

    // Validation
    if (!society_id || !student_name || !roll_number || !custom_role_title || !academic_year) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'society_id, student_name, roll_number, custom_role_title, and academic_year are required'
      });
    }

    // Validate field lengths
    if (student_name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'student_name must not exceed 100 characters'
      });
    }

    if (roll_number.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'roll_number must not exceed 50 characters'
      });
    }

    if (custom_role_title.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'custom_role_title must not exceed 100 characters'
      });
    }

    if (academic_year.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'academic_year must not exceed 20 characters'
      });
    }

    // Validate academic year format (e.g., "2023-2024")
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(academic_year)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'academic_year must be in format YYYY-YYYY (e.g., "2023-2024")'
      });
    }

    // Check if society exists
    const [societies] = await connection.query(
      'SELECT id FROM societies WHERE id = ?',
      [society_id]
    );

    if (societies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Society not found',
        message: `Society with ID ${society_id} does not exist`
      });
    }

    // Authorization: Check if user is a society leader or coordinator
    const isLeader = await isSocietyLeader(userId, society_id);
    const isCoordinator = await isSocietyCoordinator(userId, society_id);

    if (!isLeader && !isCoordinator) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only society leaders or coordinators can add cabinet members'
      });
    }

    // Insert cabinet member
    const [result] = await connection.query(
      `INSERT INTO society_cabinet 
       (society_id, student_name, roll_number, custom_role_title, academic_year, added_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [society_id, student_name, roll_number, custom_role_title, academic_year, userId]
    );

    console.log(`[CABINET] Member added: ${student_name} (${custom_role_title}) to society ${society_id} by user ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'Cabinet member added successfully',
      data: {
        id: result.insertId,
        society_id,
        student_name,
        roll_number,
        custom_role_title,
        academic_year,
        added_by: userId
      }
    });

  } catch (error) {
    console.error('[CABINET ERROR] Add member failed:', error);
    
    // Handle duplicate entry
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        message: 'This cabinet member record already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to add cabinet member'
    });
  } finally {
    connection.release();
  }
};

/**
 * GET /api/cabinet/:societyId
 * Get all cabinet members for a specific society
 * 
 * Query Parameters:
 * - academic_year (optional): Filter by academic year
 * 
 * Authorization: Any authenticated user can view
 */
const getCabinetMembers = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { societyId } = req.params;
    const { academic_year } = req.query;

    // Validate society exists
    const [societies] = await connection.query(
      'SELECT id, name FROM societies WHERE id = ?',
      [societyId]
    );

    if (societies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Society not found',
        message: `Society with ID ${societyId} does not exist`
      });
    }

    // Build query
    let query = `
      SELECT 
        sc.id,
        sc.society_id,
        sc.student_name,
        sc.roll_number,
        sc.custom_role_title,
        sc.academic_year,
        sc.added_by,
        sc.created_at,
        u.name AS added_by_name,
        u.email AS added_by_email
      FROM society_cabinet sc
      JOIN users u ON sc.added_by = u.id
      WHERE sc.society_id = ?
    `;

    const params = [societyId];

    // Add academic year filter if provided
    if (academic_year) {
      query += ' AND sc.academic_year = ?';
      params.push(academic_year);
    }

    // Order by created_at DESC
    query += ' ORDER BY sc.created_at DESC';

    const [members] = await connection.query(query, params);

    console.log(`[CABINET] Retrieved ${members.length} members for society ${societyId}${academic_year ? ` (year: ${academic_year})` : ''}`);

    return res.status(200).json({
      success: true,
      data: {
        society: societies[0],
        members: members,
        count: members.length,
        filtered_by_year: academic_year || null
      }
    });

  } catch (error) {
    console.error('[CABINET ERROR] Get members failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve cabinet members'
    });
  } finally {
    connection.release();
  }
};

/**
 * DELETE /api/cabinet/:memberId
 * Delete a cabinet member record
 * 
 * Authorization: Society Leaders, Coordinators, or DIRECTOR_SSC
 */
const deleteCabinetMember = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { memberId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the cabinet member details
    const [members] = await connection.query(
      'SELECT * FROM society_cabinet WHERE id = ?',
      [memberId]
    );

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cabinet member not found',
        message: `Cabinet member with ID ${memberId} does not exist`
      });
    }

    const member = members[0];

    // Authorization check
    const isLeader = await isSocietyLeader(userId, member.society_id);
    const isCoordinator = await isSocietyCoordinator(userId, member.society_id);
    const isDirectorSSC = userRole === 'DIRECTOR_SSC';

    if (!isLeader && !isCoordinator && !isDirectorSSC) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only society leaders, coordinators, or DIRECTOR_SSC can delete cabinet members'
      });
    }

    // Delete the member
    await connection.query(
      'DELETE FROM society_cabinet WHERE id = ?',
      [memberId]
    );

    console.log(`[CABINET] Member deleted: ID ${memberId} (${member.student_name}) from society ${member.society_id} by user ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Cabinet member deleted successfully',
      data: {
        deleted_member: {
          id: member.id,
          student_name: member.student_name,
          roll_number: member.roll_number,
          custom_role_title: member.custom_role_title
        }
      }
    });

  } catch (error) {
    console.error('[CABINET ERROR] Delete member failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete cabinet member'
    });
  } finally {
    connection.release();
  }
};

/**
 * GET /api/cabinet/member/:memberId
 * Get a single cabinet member by ID
 * 
 * Authorization: Any authenticated user can view
 */
const getCabinetMemberById = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { memberId } = req.params;

    const [members] = await connection.query(
      `SELECT 
        sc.id,
        sc.society_id,
        sc.student_name,
        sc.roll_number,
        sc.custom_role_title,
        sc.academic_year,
        sc.added_by,
        sc.created_at,
        u.name AS added_by_name,
        u.email AS added_by_email,
        s.name AS society_name
      FROM society_cabinet sc
      JOIN users u ON sc.added_by = u.id
      JOIN societies s ON sc.society_id = s.id
      WHERE sc.id = ?`,
      [memberId]
    );

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cabinet member not found',
        message: `Cabinet member with ID ${memberId} does not exist`
      });
    }

    return res.status(200).json({
      success: true,
      data: members[0]
    });

  } catch (error) {
    console.error('[CABINET ERROR] Get member by ID failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve cabinet member'
    });
  } finally {
    connection.release();
  }
};

/**
 * PUT /api/cabinet/:memberId
 * Update a cabinet member record
 * 
 * Authorization: Society Leaders, Coordinators, or DIRECTOR_SSC
 */
const updateCabinetMember = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { memberId } = req.params;
    const { student_name, roll_number, custom_role_title, academic_year } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the cabinet member details
    const [members] = await connection.query(
      'SELECT * FROM society_cabinet WHERE id = ?',
      [memberId]
    );

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cabinet member not found',
        message: `Cabinet member with ID ${memberId} does not exist`
      });
    }

    const member = members[0];

    // Authorization check
    const isLeader = await isSocietyLeader(userId, member.society_id);
    const isCoordinator = await isSocietyCoordinator(userId, member.society_id);
    const isDirectorSSC = userRole === 'DIRECTOR_SSC';

    if (!isLeader && !isCoordinator && !isDirectorSSC) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only society leaders, coordinators, or DIRECTOR_SSC can update cabinet members'
      });
    }

    // Validate fields if provided
    if (student_name && student_name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'student_name must not exceed 100 characters'
      });
    }

    if (roll_number && roll_number.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'roll_number must not exceed 50 characters'
      });
    }

    if (custom_role_title && custom_role_title.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'custom_role_title must not exceed 100 characters'
      });
    }

    if (academic_year) {
      if (academic_year.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'academic_year must not exceed 20 characters'
        });
      }

      const yearPattern = /^\d{4}-\d{4}$/;
      if (!yearPattern.test(academic_year)) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'academic_year must be in format YYYY-YYYY (e.g., "2023-2024")'
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (student_name !== undefined) {
      updates.push('student_name = ?');
      params.push(student_name);
    }
    if (roll_number !== undefined) {
      updates.push('roll_number = ?');
      params.push(roll_number);
    }
    if (custom_role_title !== undefined) {
      updates.push('custom_role_title = ?');
      params.push(custom_role_title);
    }
    if (academic_year !== undefined) {
      updates.push('academic_year = ?');
      params.push(academic_year);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: 'At least one field must be provided for update'
      });
    }

    params.push(memberId);

    await connection.query(
      `UPDATE society_cabinet SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated member
    const [updatedMembers] = await connection.query(
      `SELECT 
        sc.*,
        u.name AS added_by_name,
        s.name AS society_name
      FROM society_cabinet sc
      JOIN users u ON sc.added_by = u.id
      JOIN societies s ON sc.society_id = s.id
      WHERE sc.id = ?`,
      [memberId]
    );

    console.log(`[CABINET] Member updated: ID ${memberId} by user ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Cabinet member updated successfully',
      data: updatedMembers[0]
    });

  } catch (error) {
    console.error('[CABINET ERROR] Update member failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update cabinet member'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  addCabinetMember,
  getCabinetMembers,
  deleteCabinetMember,
  getCabinetMemberById,
  updateCabinetMember
};
