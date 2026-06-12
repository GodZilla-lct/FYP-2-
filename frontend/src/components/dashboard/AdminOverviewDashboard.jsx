/**
 * AdminOverviewDashboard.jsx — Responsive Admin Dashboard
 * Phase 3: Mobile-first responsive overhaul
 */

import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/auth';
import './AdminOverviewDashboard.css';

const AdminOverviewDashboard = ({ user, onViewProposal }) => {
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    totalProposals: 0,
    approvedProposals: 0,
    rejectedProposals: 0,
    totalSocieties: 0,
    totalBudgetAllocated: 0,
    totalBudgetRequested: 0
  });
  const [pendingProposals, setPendingProposals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const proposalsResponse = await fetch('/api/proposals', { headers: getAuthHeaders() });
      if (proposalsResponse.ok) {
        const proposalsData = await proposalsResponse.json();
        const proposals = proposalsData.proposals || [];

        const pending = proposals.filter(p =>
          p.current_status.startsWith('PENDING_') && canProcessProposal(p)
        );
        const approved = proposals.filter(p => p.current_status === 'APPROVED');
        const rejected = proposals.filter(p => p.current_status === 'REJECTED');
        const totalRequested = proposals.reduce((sum, p) => sum + (p.budget_requested || 0), 0);

        setPendingProposals(pending);
        setStats(prev => ({
          ...prev,
          pendingApprovals: pending.length,
          totalProposals: proposals.length,
          approvedProposals: approved.length,
          rejectedProposals: rejected.length,
          totalBudgetRequested: totalRequested
        }));
        setRecentActivity(proposals.slice(0, 5));
      }

      const societiesResponse = await fetch('/api/societies', { headers: getAuthHeaders() });
      if (societiesResponse.ok) {
        const societiesData = await societiesResponse.json();
        setStats(prev => ({ ...prev, totalSocieties: societiesData.societies?.length || 0 }));
      }

      if (['DIRECTOR_SSC', 'FINANCE_SECRETARY'].includes(user.role)) {
        const budgetResponse = await fetch('/api/budget/summary', { headers: getAuthHeaders() });
        if (budgetResponse.ok) {
          const budgetData = await budgetResponse.json();
          setStats(prev => ({ ...prev, totalBudgetAllocated: budgetData.totalAllocated || 0 }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const canProcessProposal = (proposal) => {
    const roleStatusMap = {
      'COORDINATOR': ['PENDING_COORDINATOR'],
      'DIRECTOR_SSC': ['PENDING_DIRECTOR_SSC'],
      'ASST_DIRECTOR': ['PENDING_ASST_DIRECTOR'],
      'FINANCE_SECRETARY': ['PENDING_FINANCE_SECRETARY'],
      'REGISTRAR': ['PENDING_REGISTRAR'],
      'VC': ['PENDING_VC'],
    };
    return roleStatusMap[user.role]?.includes(proposal.current_status) || false;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#28a745';
      case 'REJECTED': return '#dc3545';
      case 'RETURNED_FOR_REVISION': return '#ffc107';
      default: return '#17a2b8';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING_COORDINATOR: 'Pending Coordinator',
      PENDING_DIRECTOR_SSC: 'Pending Director SSC',
      PENDING_ASST_DIRECTOR: 'Pending Asst Director',
      PENDING_FINANCE_SECRETARY: 'Pending Finance',
      PENDING_REGISTRAR: 'Pending Registrar',
      PENDING_VC: 'Pending VC',
      APPROVED: 'Approved',
      RETURNED_FOR_REVISION: 'Returned',
      REJECTED: 'Rejected'
    };
    return labels[status] || status;
  };

  const getRoleTitle = (role) => {
    const titles = {
      'REGISTRAR': 'Registrar',
      'FINANCE_SECRETARY': 'Finance Secretary',
      'DIRECTOR_SSC': 'Director Student Services & Clubs',
      'ASST_DIRECTOR': 'Assistant Director',
      'COORDINATOR': 'Coordinator'
    };
    return titles[role] || role;
  };

  if (loading) {
    return (
      <div className="admin-overview-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-overview-dashboard">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="page-heading">Administrative Dashboard</h1>
          <p className="role-subtitle">{getRoleTitle(user.role)}</p>
        </div>
        <div className="header-user">
          <span className="user-name">{user.name}</span>
          <span className="user-email">{user.email}</span>
        </div>
      </div>

      {/* ── Stats Grid — responsive via CSS ── */}
      <div className="stats-grid">
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingApprovals}</h3>
            <p>Pending Your Approval</p>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalProposals}</h3>
            <p>Total Proposals</p>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.approvedProposals}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.rejectedProposals}</h3>
            <p>Rejected</p>
          </div>
        </div>

        <div className="stat-card societies">
          <div className="stat-icon">🏛️</div>
          <div className="stat-content">
            <h3>{stats.totalSocieties}</h3>
            <p>Active Societies</p>
          </div>
        </div>

        {['DIRECTOR_SSC', 'FINANCE_SECRETARY'].includes(user.role) && (
          <div className="stat-card budget">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>PKR {(stats.totalBudgetRequested / 1000000).toFixed(2)}M</h3>
              <p>Budget Requested</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Pending Approvals — scroll-safe table ── */}
      {stats.pendingApprovals > 0 && (
        <div className="section pending-approvals-section">
          <div className="section-header">
            <h2>⏳ Pending Your Approval ({stats.pendingApprovals})</h2>
            <p className="section-subtitle">Proposals awaiting your decision</p>
          </div>

          <div className="proposals-table-wrapper">
            <table className="proposals-table">
              <thead>
                <tr>
                  <th>Society</th>
                  <th>Event Title</th>
                  <th className="col-hide-sm">Event Date</th>
                  <th className="col-hide-md">Budget</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingProposals.map(proposal => (
                  <tr key={proposal.id}>
                    <td className="society-name">{proposal.society_name}</td>
                    <td className="proposal-title">{proposal.title}</td>
                    <td className="col-hide-sm">{new Date(proposal.event_date).toLocaleDateString()}</td>
                    <td className="col-hide-md budget">PKR {proposal.budget_requested.toLocaleString()}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(proposal.current_status) }}
                      >
                        {getStatusLabel(proposal.current_status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-action"
                        onClick={() => onViewProposal && onViewProposal(proposal.id)}
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── All Caught Up ── */}
      {stats.pendingApprovals === 0 && (
        <div className="section no-pending-section">
          <div className="no-pending-message">
            <div className="icon">✓</div>
            <h3>All Caught Up!</h3>
            <p>No proposals pending your approval at this time.</p>
          </div>
        </div>
      )}

      {/* ── Recent Activity ── */}
      <div className="section recent-activity-section">
        <div className="section-header">
          <h2>📊 Recent Activity</h2>
          <p className="section-subtitle">Latest proposals in the system</p>
        </div>

        {recentActivity.length === 0 ? (
          <div className="no-activity"><p>No recent activity to display.</p></div>
        ) : (
          <div className="activity-list">
            {recentActivity.map(proposal => (
              <div key={proposal.id} className="activity-item">
                <div className="activity-icon">
                  {proposal.current_status === 'APPROVED' ? '✅' :
                   proposal.current_status === 'REJECTED' ? '❌' : '📄'}
                </div>
                <div className="activity-content">
                  <h4>{proposal.title}</h4>
                  <p className="activity-meta">
                    <span className="society">{proposal.society_name}</span>
                    <span className="separator">•</span>
                    <span className="status" style={{ color: getStatusColor(proposal.current_status) }}>
                      {getStatusLabel(proposal.current_status)}
                    </span>
                  </p>
                </div>
                <div className="activity-budget">
                  PKR {proposal.budget_requested.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminOverviewDashboard;
