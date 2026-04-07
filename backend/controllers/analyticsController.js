const pool = require('../config/database');

/**
 * Get dashboard analytics
 * GET /analytics/dashboard
 */
async function getDashboardAnalytics(req, res) {
  const connection = await pool.getConnection();

  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    // Total proposals
    const [totalProposals] = await connection.query(
      'SELECT COUNT(*) as count FROM proposals'
    );

    // Proposals by status
    const [statusCounts] = await connection.query(
      `SELECT current_status, COUNT(*) as count 
       FROM proposals 
       GROUP BY current_status`
    );

    // Total budget requested
    const [budgetStats] = await connection.query(
      `SELECT 
        SUM(budget_requested) as total_requested,
        SUM(CASE WHEN current_status = 'APPROVED' THEN budget_requested ELSE 0 END) as total_approved,
        AVG(budget_requested) as avg_budget
       FROM proposals`
    );

    // Proposals by society
    const [societyStats] = await connection.query(
      `SELECT s.name, COUNT(p.id) as proposal_count, SUM(p.budget_requested) as total_budget
       FROM societies s
       LEFT JOIN proposals p ON s.id = p.society_id
       GROUP BY s.id, s.name
       ORDER BY proposal_count DESC
       LIMIT 10`
    );

    // Recent activity
    const [recentActivity] = await connection.query(
      `SELECT ah.*, p.title as proposal_title, u.name as approver_name, u.role as approver_role
       FROM approval_history ah
       JOIN proposals p ON ah.proposal_id = p.id
       JOIN users u ON ah.approver_id = u.id
       ORDER BY ah.created_at DESC
       LIMIT 10`
    );

    // Monthly trends (last 6 months)
    const [monthlyTrends] = await connection.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(budget_requested) as total_budget
       FROM proposals
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
    );

    // Approval rate
    const [approvalRate] = await connection.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN current_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN current_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
       FROM proposals`
    );

    // Average approval time (in days)
    const [avgApprovalTime] = await connection.query(
      `SELECT AVG(DATEDIFF(updated_at, created_at)) as avg_days
       FROM proposals
       WHERE current_status = 'APPROVED'`
    );

    // Role-specific stats
    let roleSpecificStats = {};

    if (userRole === 'DIRECTOR_SSC' || userRole === 'ASST_DIRECTOR' || userRole === 'FINANCE_SECRETARY' || userRole === 'REGISTRAR' || userRole === 'VC') {
      // Pending proposals for this role
      const statusMap = {
        DIRECTOR_SSC: 'PENDING_DIRECTOR_SSC',
        ASST_DIRECTOR: 'PENDING_ASST_DIRECTOR',
        FINANCE_SECRETARY: 'PENDING_FINANCE_SECRETARY',
        REGISTRAR: 'PENDING_REGISTRAR',
        VC: 'PENDING_VC',
      };

      const [pendingForRole] = await connection.query(
        'SELECT COUNT(*) as count FROM proposals WHERE current_status = ?',
        [statusMap[userRole]]
      );

      roleSpecificStats.pendingCount = pendingForRole[0].count;

      // Approvals by this user
      const [myApprovals] = await connection.query(
        'SELECT COUNT(*) as count FROM approval_history WHERE approver_id = ?',
        [userId]
      );

      roleSpecificStats.myApprovalsCount = myApprovals[0].count;
    }

    res.json({
      success: true,
      analytics: {
        overview: {
          totalProposals: totalProposals[0].count,
          totalBudgetRequested: budgetStats[0].total_requested || 0,
          totalBudgetApproved: budgetStats[0].total_approved || 0,
          averageBudget: budgetStats[0].avg_budget || 0,
          approvalRate: approvalRate[0].total > 0 
            ? ((approvalRate[0].approved / approvalRate[0].total) * 100).toFixed(2)
            : 0,
          averageApprovalTime: avgApprovalTime[0].avg_days || 0,
        },
        statusBreakdown: statusCounts,
        societyStats,
        monthlyTrends,
        recentActivity,
        roleSpecificStats,
      },
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  } finally {
    connection.release();
  }
}

/**
 * Get society analytics
 * GET /analytics/society/:id
 */
async function getSocietyAnalytics(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    // Verify society exists
    const [societies] = await connection.query(
      'SELECT name FROM societies WHERE id = ?',
      [id]
    );

    if (societies.length === 0) {
      return res.status(404).json({ error: 'Society not found' });
    }

    // Total proposals
    const [totalProposals] = await connection.query(
      'SELECT COUNT(*) as count FROM proposals WHERE society_id = ?',
      [id]
    );

    // Status breakdown
    const [statusCounts] = await connection.query(
      `SELECT current_status, COUNT(*) as count 
       FROM proposals 
       WHERE society_id = ?
       GROUP BY current_status`,
      [id]
    );

    // Budget stats
    const [budgetStats] = await connection.query(
      `SELECT 
        SUM(budget_requested) as total_requested,
        SUM(CASE WHEN current_status = 'APPROVED' THEN budget_requested ELSE 0 END) as total_approved
       FROM proposals
       WHERE society_id = ?`,
      [id]
    );

    // Recent proposals
    const [recentProposals] = await connection.query(
      `SELECT id, title, current_status, budget_requested, created_at
       FROM proposals
       WHERE society_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [id]
    );

    res.json({
      success: true,
      societyName: societies[0].name,
      analytics: {
        totalProposals: totalProposals[0].count,
        statusBreakdown: statusCounts,
        totalBudgetRequested: budgetStats[0].total_requested || 0,
        totalBudgetApproved: budgetStats[0].total_approved || 0,
        recentProposals,
      },
    });

  } catch (error) {
    console.error('Get society analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch society analytics' });
  } finally {
    connection.release();
  }
}

/**
 * Export analytics report
 * GET /analytics/export
 */
async function exportAnalyticsReport(req, res) {
  const connection = await pool.getConnection();

  try {
    const { format = 'json', startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE p.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Get comprehensive data
    const [proposals] = await connection.query(
      `SELECT 
        p.id, p.title, p.description, p.event_date, p.budget_requested, p.current_status,
        s.name as society_name,
        u.name as created_by,
        p.created_at, p.updated_at
       FROM proposals p
       JOIN societies s ON p.society_id = s.id
       JOIN users u ON p.user_id = u.id
       ${dateFilter}
       ORDER BY p.created_at DESC`,
      params
    );

    if (format === 'csv') {
      // Generate CSV
      const csv = [
        'ID,Title,Society,Created By,Event Date,Budget,Status,Created At',
        ...proposals.map(p => 
          `${p.id},"${p.title}","${p.society_name}","${p.created_by}",${p.event_date},${p.budget_requested},${p.current_status},${p.created_at}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=proposals_report.csv');
      return res.send(csv);
    }

    // Return JSON
    res.json({
      success: true,
      report: proposals,
      generatedAt: new Date(),
    });

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  } finally {
    connection.release();
  }
}

module.exports = {
  getDashboardAnalytics,
  getSocietyAnalytics,
  exportAnalyticsReport,
};
