const db = require('../config/database');

// Get all societies with their cabinet members
const getAllSocieties = async (req, res) => {
  try {
    const [societies] = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.created_at
      FROM societies s
      ORDER BY s.name
    `);

    // Get cabinet members for each society
    for (let society of societies) {
      const [roles] = await db.query(`
        SELECT 
          sr.id,
          sr.role_name,
          sr.is_core_leader,
          u.name,
          u.roll_number,
          u.email
        FROM society_roles sr
        JOIN users u ON sr.user_id = u.id
        WHERE sr.society_id = ?
        ORDER BY sr.is_core_leader DESC, sr.role_name
      `, [society.id]);

      society.roles = roles;
    }

    res.json({ societies });
  } catch (error) {
    console.error('Error fetching societies:', error);
    res.status(500).json({ error: 'Failed to fetch societies' });
  }
};

// Get single society details
const getSocietyById = async (req, res) => {
  const { id } = req.params;

  try {
    const [societies] = await db.query(
      'SELECT * FROM societies WHERE id = ?',
      [id]
    );

    if (societies.length === 0) {
      return res.status(404).json({ error: 'Society not found' });
    }

    const society = societies[0];

    // Get cabinet members
    const [roles] = await db.query(`
      SELECT 
        sr.id,
        sr.role_name,
        sr.is_core_leader,
        u.name,
        u.roll_number,
        u.email
      FROM society_roles sr
      JOIN users u ON sr.user_id = u.id
      WHERE sr.society_id = ?
      ORDER BY sr.is_core_leader DESC, sr.role_name
    `, [id]);

    society.roles = roles;

    res.json({ society });
  } catch (error) {
    console.error('Error fetching society:', error);
    res.status(500).json({ error: 'Failed to fetch society' });
  }
};

// Create new society (Director SSC only)
const createSociety = async (req, res) => {
  const { name, description } = req.body;

  if (req.user.role !== 'DIRECTOR_SSC') {
    return res.status(403).json({ error: 'Only Director SSC can create societies' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO societies (name, description) VALUES (?, ?)',
      [name, description]
    );

    res.status(201).json({
      success: true,
      society: {
        id: result.insertId,
        name,
        description
      }
    });
  } catch (error) {
    console.error('Error creating society:', error);
    res.status(500).json({ error: 'Failed to create society' });
  }
};

// Update society (Director SSC only)
const updateSociety = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (req.user.role !== 'DIRECTOR_SSC') {
    return res.status(403).json({ error: 'Only Director SSC can update societies' });
  }

  try {
    await db.query(
      'UPDATE societies SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );

    res.json({ success: true, message: 'Society updated successfully' });
  } catch (error) {
    console.error('Error updating society:', error);
    res.status(500).json({ error: 'Failed to update society' });
  }
};

// Add cabinet member to society (Director SSC only)
const addCabinetMember = async (req, res) => {
  const { societyId, userId, roleName, isCoreLeader } = req.body;

  if (req.user.role !== 'DIRECTOR_SSC') {
    return res.status(403).json({ error: 'Only Director SSC can add cabinet members' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO society_roles (society_id, user_id, role_name, is_core_leader) VALUES (?, ?, ?, ?)',
      [societyId, userId, roleName, isCoreLeader || false]
    );

    res.status(201).json({
      success: true,
      message: 'Cabinet member added successfully',
      roleId: result.insertId
    });
  } catch (error) {
    console.error('Error adding cabinet member:', error);
    res.status(500).json({ error: 'Failed to add cabinet member' });
  }
};

// Remove cabinet member (Director SSC only)
const removeCabinetMember = async (req, res) => {
  const { roleId } = req.params;

  if (req.user.role !== 'DIRECTOR_SSC') {
    return res.status(403).json({ error: 'Only Director SSC can remove cabinet members' });
  }

  try {
    await db.query('DELETE FROM society_roles WHERE id = ?', [roleId]);
    res.json({ success: true, message: 'Cabinet member removed successfully' });
  } catch (error) {
    console.error('Error removing cabinet member:', error);
    res.status(500).json({ error: 'Failed to remove cabinet member' });
  }
};

module.exports = {
  getAllSocieties,
  getSocietyById,
  createSociety,
  updateSociety,
  addCabinetMember,
  removeCabinetMember
};
