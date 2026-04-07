const pool = require('../config/database');

/**
 * Advanced search for proposals
 * GET /search/proposals
 */
async function searchProposals(req, res) {
  const connection = await pool.getConnection();

  try {
    const {
      query = '',
      status,
      societyId,
      startDate,
      endDate,
      minBudget,
      maxBudget,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    // Text search in title and description
    if (query) {
      conditions.push('(p.title LIKE ? OR p.description LIKE ?)');
      params.push(`%${query}%`, `%${query}%`);
    }

    // Filter by status
    if (status) {
      conditions.push('p.current_status = ?');
      params.push(status);
    }

    // Filter by society
    if (societyId) {
      conditions.push('p.society_id = ?');
      params.push(societyId);
    }

    // Filter by date range
    if (startDate) {
      conditions.push('p.event_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('p.event_date <= ?');
      params.push(endDate);
    }

    // Filter by budget range
    if (minBudget) {
      conditions.push('p.budget_requested >= ?');
      params.push(minBudget);
    }

    if (maxBudget) {
      conditions.push('p.budget_requested <= ?');
      params.push(maxBudget);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['created_at', 'updated_at', 'event_date', 'budget_requested', 'title'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM proposals p ${whereClause}`,
      params
    );

    const totalCount = countResult[0].total;

    // Get proposals
    const [proposals] = await connection.query(
      `SELECT 
        p.*,
        s.name as society_name,
        u.name as created_by_name,
        u.roll_number as created_by_roll
       FROM proposals p
       JOIN societies s ON p.society_id = s.id
       JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY p.${sortColumn} ${sortDirection}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      proposals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });

  } catch (error) {
    console.error('Search proposals error:', error);
    res.status(500).json({ error: 'Search failed' });
  } finally {
    connection.release();
  }
}

/**
 * Search users
 * GET /search/users
 */
async function searchUsers(req, res) {
  const connection = await pool.getConnection();

  try {
    const { query = '', role, limit = 20 } = req.query;

    const conditions = [];
    const params = [];

    if (query) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.roll_number LIKE ?)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (role) {
      conditions.push('u.role = ?');
      params.push(role);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [users] = await connection.query(
      `SELECT id, name, email, roll_number, role, is_active, created_at
       FROM users u
       ${whereClause}
       ORDER BY name ASC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );

    res.json({
      success: true,
      users,
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'User search failed' });
  } finally {
    connection.release();
  }
}

/**
 * Get saved search filters
 * GET /search/filters
 */
async function getSavedFilters(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    const [filters] = await connection.query(
      'SELECT * FROM saved_search_filters WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      filters,
    });

  } catch (error) {
    console.error('Get saved filters error:', error);
    res.status(500).json({ error: 'Failed to fetch saved filters' });
  } finally {
    connection.release();
  }
}

/**
 * Save search filter
 * POST /search/filters
 */
async function saveSearchFilter(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const { name, filters } = req.body;

    if (!name || !filters) {
      return res.status(400).json({ error: 'Name and filters are required' });
    }

    const [result] = await connection.query(
      'INSERT INTO saved_search_filters (user_id, name, filters) VALUES (?, ?, ?)',
      [userId, name, JSON.stringify(filters)]
    );

    res.status(201).json({
      success: true,
      message: 'Filter saved successfully',
      filterId: result.insertId,
    });

  } catch (error) {
    console.error('Save filter error:', error);
    res.status(500).json({ error: 'Failed to save filter' });
  } finally {
    connection.release();
  }
}

/**
 * Delete saved filter
 * DELETE /search/filters/:id
 */
async function deleteSavedFilter(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    await connection.query(
      'DELETE FROM saved_search_filters WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Filter deleted successfully',
    });

  } catch (error) {
    console.error('Delete filter error:', error);
    res.status(500).json({ error: 'Failed to delete filter' });
  } finally {
    connection.release();
  }
}

module.exports = {
  searchProposals,
  searchUsers,
  getSavedFilters,
  saveSearchFilter,
  deleteSavedFilter,
};
