const pool = require('../config/database');

/**
 * Get all venues (for dropdown and management)
 * GET /api/venues
 */
async function getAllVenues(req, res) {
  const connection = await pool.getConnection();

  try {
    const { availableOnly } = req.query;

    let query = 'SELECT * FROM venues';
    
    if (availableOnly === 'true') {
      query += ' WHERE is_available = TRUE';
    }
    
    query += ' ORDER BY name ASC';

    const [venues] = await connection.query(query);

    res.json({
      success: true,
      venues
    });

  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  } finally {
    await connection.release();
  }
}

/**
 * Create a new venue (SYSTEM_ADMIN only)
 * POST /api/venues
 */
async function createVenue(req, res) {
  const connection = await pool.getConnection();

  try {
    const { name, capacity } = req.body;

    // Validate input
    if (!name || !capacity) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name and capacity are required'
      });
    }

    if (capacity < 0) {
      return res.status(400).json({ 
        error: 'Invalid capacity',
        details: 'Capacity must be a positive number'
      });
    }

    // Check for duplicate name
    const [existing] = await connection.query(
      'SELECT id FROM venues WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Duplicate venue',
        details: 'A venue with this name already exists'
      });
    }

    // Create venue
    const [result] = await connection.query(
      'INSERT INTO venues (name, capacity, is_available) VALUES (?, ?, TRUE)',
      [name, capacity]
    );

    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      venue: {
        id: result.insertId,
        name,
        capacity,
        is_available: true
      }
    });

  } catch (error) {
    console.error('Create venue error:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  } finally {
    await connection.release();
  }
}

/**
 * Update venue (SYSTEM_ADMIN only)
 * PUT /api/venues/:id
 */
async function updateVenue(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { name, capacity, is_available } = req.body;

    // Verify venue exists
    const [venues] = await connection.query(
      'SELECT * FROM venues WHERE id = ?',
      [id]
    );

    if (venues.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (capacity !== undefined) {
      if (capacity < 0) {
        return res.status(400).json({ 
          error: 'Invalid capacity',
          details: 'Capacity must be a positive number'
        });
      }
      updates.push('capacity = ?');
      values.push(capacity);
    }

    if (is_available !== undefined) {
      updates.push('is_available = ?');
      values.push(is_available);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await connection.query(
      `UPDATE venues SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Get updated venue
    const [updated] = await connection.query(
      'SELECT * FROM venues WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Venue updated successfully',
      venue: updated[0]
    });

  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  } finally {
    await connection.release();
  }
}

/**
 * Delete venue (SYSTEM_ADMIN only)
 * DELETE /api/venues/:id
 */
async function deleteVenue(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    // Check if venue is used in any proposals
    const [proposals] = await connection.query(
      'SELECT COUNT(*) as count FROM proposals WHERE venue_id = ?',
      [id]
    );

    if (proposals[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete venue',
        details: 'This venue is referenced in existing proposals'
      });
    }

    // Delete venue
    const [result] = await connection.query(
      'DELETE FROM venues WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({
      success: true,
      message: 'Venue deleted successfully'
    });

  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
  } finally {
    await connection.release();
  }
}

/**
 * Check venue availability for a specific date
 * POST /api/venues/check-availability
 */
async function checkVenueAvailability(req, res) {
  const connection = await pool.getConnection();

  try {
    const { venueId, eventDate, excludeProposalId } = req.body;

    if (!venueId || !eventDate) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'venueId and eventDate are required'
      });
    }

    // Check if venue is available (not disabled)
    const [venues] = await connection.query(
      'SELECT is_available FROM venues WHERE id = ?',
      [venueId]
    );

    if (venues.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (!venues[0].is_available) {
      return res.json({
        available: false,
        reason: 'This venue is currently unavailable'
      });
    }

    // Check for conflicting APPROVED proposals on the same date
    let query = `
      SELECT p.id, p.title, s.name as society_name 
      FROM proposals p
      JOIN societies s ON p.society_id = s.id
      WHERE p.venue_id = ? 
      AND p.event_date = ? 
      AND p.current_status = 'APPROVED'
    `;
    
    const params = [venueId, eventDate];

    // Exclude current proposal if editing
    if (excludeProposalId) {
      query += ' AND p.id != ?';
      params.push(excludeProposalId);
    }

    const [conflicts] = await connection.query(query, params);

    if (conflicts.length > 0) {
      return res.json({
        available: false,
        reason: 'This venue is already booked for this date',
        conflict: conflicts[0]
      });
    }

    res.json({
      available: true,
      message: 'Venue is available for this date'
    });

  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check venue availability' });
  } finally {
    await connection.release();
  }
}

module.exports = {
  getAllVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  checkVenueAvailability
};
