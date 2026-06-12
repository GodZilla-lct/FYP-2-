import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/auth';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedView, setSelectedView] = useState('overview');
  const [societyDrilldown, setSocietyDrilldown] = useState(null);
  const [societyDrillLoading, setSocietyDrillLoading] = useState(false);
  const [societyDrillError, setSocietyDrillError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/overview', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSocietyAnalytics = async (societyId) => {
    setSocietyDrillLoading(true);
    setSocietyDrillError('');
    setSocietyDrilldown(null);
    try {
      const res = await fetch(`/api/analytics/society/${societyId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) {
        setSocietyDrillError(data.error || 'Failed to load society analytics');
        return;
      }
      setSocietyDrilldown(data);
    } catch (e) {
      setSocietyDrillError(e.message || 'Request failed');
    } finally {
      setSocietyDrillLoading(false);
    }
  };

  const exportReport = async (format = 'json') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}`, {
        headers: getAuthHeaders()
      });

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'proposals_report.csv';
        a.click();
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'proposals_report.json';
        a.click();
      }
    } catch (err) {
      setError('Failed to export report');
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="analytics-error">Error: {error}</div>;
  }

  if (!analytics) {
    return <div className="analytics-error">No analytics data available</div>;
  }

  const { overview, statusBreakdown, societyStats, monthlyTrends, recentActivity, roleSpecificStats } = analytics;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>📊 Analytics Dashboard</h1>
        <div className="analytics-actions">
          <button onClick={() => exportReport('csv')} className="btn btn-outline">
            Export CSV
          </button>
          <button onClick={() => exportReport('json')} className="btn btn-outline">
            Export JSON
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="analytics-tabs">
        <button 
          className={`tab ${selectedView === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedView('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${selectedView === 'trends' ? 'active' : ''}`}
          onClick={() => setSelectedView('trends')}
        >
          Trends
        </button>
        <button 
          className={`tab ${selectedView === 'societies' ? 'active' : ''}`}
          onClick={() => setSelectedView('societies')}
        >
          Societies
        </button>
        <button 
          className={`tab ${selectedView === 'activity' ? 'active' : ''}`}
          onClick={() => setSelectedView('activity')}
        >
          Recent Activity
        </button>
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <div className="analytics-content">
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-value">{overview.totalProposals}</div>
              <div className="stat-label">Total Proposals</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">PKR {(overview.totalBudgetRequested / 1000).toFixed(0)}K</div>
              <div className="stat-label">Budget Requested</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">PKR {(overview.totalBudgetApproved / 1000).toFixed(0)}K</div>
              <div className="stat-label">Budget Approved</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-value">{overview.approvalRate}%</div>
              <div className="stat-label">Approval Rate</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-value">{Math.round(overview.averageApprovalTime)} days</div>
              <div className="stat-label">Avg Approval Time</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-value">PKR {(overview.averageBudget / 1000).toFixed(0)}K</div>
              <div className="stat-label">Avg Budget</div>
            </div>
          </div>

          {/* Role Specific Stats */}
          {roleSpecificStats && Object.keys(roleSpecificStats).length > 0 && (
            <div className="role-stats">
              <h3>Your Stats</h3>
              <div className="stats-grid small grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roleSpecificStats.pendingCount !== undefined && (
                  <div className="stat-card small">
                    <div className="stat-value">{roleSpecificStats.pendingCount}</div>
                    <div className="stat-label">Pending Your Review</div>
                  </div>
                )}
                {roleSpecificStats.myApprovalsCount !== undefined && (
                  <div className="stat-card small">
                    <div className="stat-value">{roleSpecificStats.myApprovalsCount}</div>
                    <div className="stat-label">Your Approvals</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Breakdown */}
          <div className="status-breakdown">
            <h3>Proposals by Status</h3>
            <div className="status-chart">
              {statusBreakdown.map((status) => (
                <div key={status.current_status} className="status-bar">
                  <div className="status-label">
                    {status.current_status.replace(/_/g, ' ')}
                  </div>
                  <div className="status-progress">
                    <div 
                      className="status-fill"
                      style={{ 
                        width: `${(status.count / overview.totalProposals) * 100}%`,
                        backgroundColor: getStatusColor(status.current_status)
                      }}
                    ></div>
                  </div>
                  <div className="status-count">{status.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {selectedView === 'trends' && (
        <div className="analytics-content">
          <h3>Monthly Trends (Last 6 Months)</h3>
          <div className="trends-chart">
            {monthlyTrends.map((trend) => (
              <div key={trend.month} className="trend-bar">
                <div className="trend-month">{trend.month}</div>
                <div className="trend-data">
                  <div className="trend-count">{trend.count} proposals</div>
                  <div className="trend-budget">PKR {(trend.total_budget / 1000).toFixed(0)}K</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Societies Tab */}
      {selectedView === 'societies' && (
        <div className="analytics-content">
          <h3>Top Societies by Proposals</h3>
          <div className="overflow-x-auto whitespace-nowrap scrollbar-thin">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left">Society</th>
                  <th className="hidden sm:table-cell text-left">Proposals</th>
                  <th className="hidden md:table-cell text-left">Total Budget</th>
                  <th className="text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {societyStats.map((society) => (
                  <tr key={society.society_id || society.name}>
                    <td>{society.name}</td>
                    <td className="hidden sm:table-cell">{society.proposal_count}</td>
                    <td className="hidden md:table-cell">PKR {(society.total_budget || 0).toLocaleString()}</td>
                    <td>
                      {society.society_id != null && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => loadSocietyAnalytics(society.society_id)}
                        >
                          View breakdown
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {societyDrillLoading && <p className="analytics-loading">Loading society analytics…</p>}
          {societyDrillError && <p className="analytics-error">{societyDrillError}</p>}
          {societyDrilldown && societyDrilldown.analytics && (
            <div className="society-drill-panel">
              <h4>{societyDrilldown.societyName}</h4>
              <p>
                Total proposals: <strong>{societyDrilldown.analytics.totalProposals}</strong> · Budget requested:{' '}
                <strong>PKR {Number(societyDrilldown.analytics.totalBudgetRequested || 0).toLocaleString()}</strong> ·
                Approved spend:{' '}
                <strong>PKR {Number(societyDrilldown.analytics.totalBudgetApproved || 0).toLocaleString()}</strong>
              </p>
              <h5>Status mix</h5>
              <ul className="society-status-list">
                {(societyDrilldown.analytics.statusBreakdown || []).map((row) => (
                  <li key={row.current_status}>
                    {row.current_status}: {row.count}
                  </li>
                ))}
              </ul>
              <h5>Recent proposals</h5>
              <ul className="society-recent-list">
                {(societyDrilldown.analytics.recentProposals || []).map((p) => (
                  <li key={p.id}>
                    #{p.id} {p.title} — {p.current_status} (PKR {Number(p.budget_requested || 0).toLocaleString()})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {selectedView === 'activity' && (
        <div className="analytics-content">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.action === 'APPROVED' ? '✅' : activity.action === 'REJECTED' ? '❌' : '🔄'}
                </div>
                <div className="activity-details">
                  <div className="activity-title">{activity.proposal_title}</div>
                  <div className="activity-meta">
                    {activity.approver_name} ({activity.approver_role}) - {activity.action}
                  </div>
                  <div className="activity-time">
                    {new Date(activity.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function getStatusColor(status) {
  const colors = {
    APPROVED: '#28a745',
    REJECTED: '#dc3545',
    RETURNED_FOR_REVISION: '#ffc107',
    PENDING_COORDINATOR: '#17a2b8',
    PENDING_DIRECTOR_SSC: '#17a2b8',
    PENDING_ASST_DIRECTOR: '#17a2b8',
    PENDING_FINANCE_SECRETARY: '#17a2b8',
    PENDING_REGISTRAR: '#17a2b8',
    PENDING_VC: '#17a2b8',
  };
  return colors[status] || '#6c757d';
}

export default Analytics;
