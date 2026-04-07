const pool = require('../config/database');

/**
 * Get budget allocations for all societies
 * GET /budget/allocations
 */
async function getBudgetAllocations(req, res) {
  const connection = await pool.getConnection();

  try {
    const { financialYear } = req.query;

    let query = `
      SELECT ba.*, s.name as society_name
      FROM budget_allocations ba
      JOIN societies s ON ba.society_id = s.id
    `;

    const params = [];

    if (financialYear) {
      query += ' WHERE ba.financial_year = ?';
      params.push(financialYear);
    }

    query += ' ORDER BY s.name ASC';

    const [allocations] = await connection.query(query, params);

    // Calculate spent and remaining for each allocation
    for (let allocation of allocations) {
      const [spent] = await connection.query(
        `SELECT SUM(budget_requested) as total_spent
         FROM proposals
         WHERE society_id = ? AND current_status = 'APPROVED'
         AND YEAR(event_date) = ?`,
        [allocation.society_id, allocation.financial_year]
      );

      allocation.spent = spent[0].total_spent || 0;
      allocation.remaining = allocation.allocated_amount - allocation.spent;
      allocation.utilization_percentage = allocation.allocated_amount > 0
        ? ((allocation.spent / allocation.allocated_amount) * 100).toFixed(2)
        : 0;
    }

    res.json({
      success: true,
      allocations,
    });

  } catch (error) {
    console.error('Get budget allocations error:', error);
    res.status(500).json({ error: 'Failed to fetch budget allocations' });
  } finally {
    connection.release();
  }
}

/**
 * Set budget allocation for a society
 * POST /budget/allocations
 */
async function setBudgetAllocation(req, res) {
  const connection = await pool.getConnection();

  try {
    const { societyId, financialYear, allocatedAmount } = req.body;

    if (!societyId || !financialYear || !allocatedAmount) {
      return res.status(400).json({ error: 'Society ID, financial year, and allocated amount are required' });
    }

    // Check if allocation already exists
    const [existing] = await connection.query(
      'SELECT id FROM budget_allocations WHERE society_id = ? AND financial_year = ?',
      [societyId, financialYear]
    );

    if (existing.length > 0) {
      // Update existing allocation
      await connection.query(
        'UPDATE budget_allocations SET allocated_amount = ? WHERE id = ?',
        [allocatedAmount, existing[0].id]
      );

      return res.json({
        success: true,
        message: 'Budget allocation updated successfully',
      });
    }

    // Create new allocation
    await connection.query(
      'INSERT INTO budget_allocations (society_id, financial_year, allocated_amount) VALUES (?, ?, ?)',
      [societyId, financialYear, allocatedAmount]
    );

    res.status(201).json({
      success: true,
      message: 'Budget allocation created successfully',
    });

  } catch (error) {
    console.error('Set budget allocation error:', error);
    res.status(500).json({ error: 'Failed to set budget allocation' });
  } finally {
    connection.release();
  }
}

/**
 * Get budget summary
 * GET /budget/summary
 */
async function getBudgetSummary(req, res) {
  const connection = await pool.getConnection();

  try {
    const { financialYear = new Date().getFullYear() } = req.query;

    // Total allocated
    const [totalAllocated] = await connection.query(
      'SELECT SUM(allocated_amount) as total FROM budget_allocations WHERE financial_year = ?',
      [financialYear]
    );

    // Total spent (approved proposals)
    const [totalSpent] = await connection.query(
      `SELECT SUM(budget_requested) as total 
       FROM proposals 
       WHERE current_status = 'APPROVED' AND YEAR(event_date) = ?`,
      [financialYear]
    );

    // Pending approvals budget
    const [pendingBudget] = await connection.query(
      `SELECT SUM(budget_requested) as total 
       FROM proposals 
       WHERE current_status NOT IN ('APPROVED', 'REJECTED') AND YEAR(event_date) = ?`,
      [financialYear]
    );

    // Budget by status
    const [budgetByStatus] = await connection.query(
      `SELECT current_status, SUM(budget_requested) as total_budget, COUNT(*) as count
       FROM proposals
       WHERE YEAR(event_date) = ?
       GROUP BY current_status`,
      [financialYear]
    );

    res.json({
      success: true,
      financialYear,
      summary: {
        totalAllocated: totalAllocated[0].total || 0,
        totalSpent: totalSpent[0].total || 0,
        pendingBudget: pendingBudget[0].total || 0,
        remaining: (totalAllocated[0].total || 0) - (totalSpent[0].total || 0),
        utilizationRate: totalAllocated[0].total > 0
          ? (((totalSpent[0].total || 0) / totalAllocated[0].total) * 100).toFixed(2)
          : 0,
      },
      budgetByStatus,
    });

  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({ error: 'Failed to fetch budget summary' });
  } finally {
    connection.release();
  }
}

/**
 * Check if society has sufficient budget
 * GET /budget/check/:societyId
 */
async function checkBudgetAvailability(req, res) {
  const connection = await pool.getConnection();

  try {
    const { societyId } = req.params;
    const { amount, financialYear = new Date().getFullYear() } = req.query;

    // Get allocation
    const [allocations] = await connection.query(
      'SELECT allocated_amount FROM budget_allocations WHERE society_id = ? AND financial_year = ?',
      [societyId, financialYear]
    );

    if (allocations.length === 0) {
      return res.json({
        success: true,
        available: false,
        message: 'No budget allocation found for this society',
      });
    }

    const allocated = allocations[0].allocated_amount;

    // Get spent amount
    const [spent] = await connection.query(
      `SELECT SUM(budget_requested) as total_spent
       FROM proposals
       WHERE society_id = ? AND current_status = 'APPROVED' AND YEAR(event_date) = ?`,
      [societyId, financialYear]
    );

    const totalSpent = spent[0].total_spent || 0;
    const remaining = allocated - totalSpent;
    const requestedAmount = parseFloat(amount);

    res.json({
      success: true,
      available: remaining >= requestedAmount,
      allocated,
      spent: totalSpent,
      remaining,
      requestedAmount,
    });

  } catch (error) {
    console.error('Check budget availability error:', error);
    res.status(500).json({ error: 'Failed to check budget availability' });
  } finally {
    connection.release();
  }
}

module.exports = {
  getBudgetAllocations,
  setBudgetAllocation,
  getBudgetSummary,
  checkBudgetAvailability,
};
