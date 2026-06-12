import React, { useState, useEffect } from 'react';
import VenueManagement from './VenueManagement';
import { setAuthData, getRefreshToken } from '../../utils/auth';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [, setSystemSettings] = useState({ global_freeze: false, announcement_text: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Status change states
  const [statusChanges, setStatusChanges] = useState({});

  // System settings form state
  const [settingsForm, setSettingsForm] = useState({ freeze: false, announcement: '', color: 'bg-blue-500' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  
  const [roleSelections, setRoleSelections] = useState({});
  
  const ROLE_OPTIONS = [
    'STUDENT',
    'COORDINATOR',
    'DIRECTOR_SSC',
    'ASST_DIRECTOR',
    'FINANCE_SECRETARY',
    'REGISTRAR',
    'VC',
    'SYSTEM_ADMIN',
  ];

  // All proposal statuses
  const PROPOSAL_STATUSES = [
    'PENDING_COORDINATOR',
    'PENDING_DIRECTOR_SSC',
    'PENDING_ASST_DIRECTOR',
    'PENDING_FINANCE_SECRETARY',
    'PENDING_REGISTRAR',
    'PENDING_VC',
    'APPROVED',
    'RETURNED_FOR_REVISION',
    'REJECTED'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('campus_connect_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [usersRes, proposalsRes, ticketsRes, logsRes, settingsRes] = await Promise.all([
        fetch('/api/super/users', { headers }),
        fetch('/api/super/proposals', { headers }),
        fetch('/api/super/tickets', { headers }),
        fetch('/api/super/logs?limit=200', { headers }),
        fetch('/api/system/settings'),
      ]);

      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (!proposalsRes.ok) throw new Error('Failed to fetch proposals');
      if (!ticketsRes.ok) throw new Error('Failed to fetch tickets');

      const [usersData, proposalsData, ticketsData] = await Promise.all([
        usersRes.json(), proposalsRes.json(), ticketsRes.json()
      ]);

      const list = usersData.users || [];
      setUsers(list);
      setRoleSelections(
        list.reduce((acc, u) => {
          acc[u.id] = u.role;
          return acc;
        }, {})
      );
      setProposals(proposalsData.proposals || []);
      setTickets(ticketsData.tickets || []);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSystemSettings(settingsData);
        setSettingsForm({
          freeze: settingsData.global_freeze || false,
          announcement: settingsData.announcement_text || '',
          color: settingsData.announcement_color || 'bg-blue-500'
        });
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForcePasswordReset = (targetUser) => {
    setSelectedUser(targetUser);
    setNewPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleSaveRole = async (u) => {
    const newRole = roleSelections[u.id];
    if (!newRole || newRole === u.role) return;
    const token = localStorage.getItem('campus_connect_token');
    const res = await fetch(`/api/super/users/${u.id}/role`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      alert(data.message || 'Role updated');
      fetchData();
    } else {
      alert(data.error || 'Failed to update role');
    }
  };

  const handleImpersonate = async (u) => {
    if (!window.confirm(`Sign in as ${u.name}? Log out when finished testing.`)) return;
    try {
      const token = localStorage.getItem('campus_connect_token');
      const res = await fetch(`/api/super/impersonate/${u.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Impersonation failed');
        return;
      }
      const access = data.accessToken || data.token;
      const refresh = getRefreshToken() || '';
      setAuthData(access, refresh, {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        rollNumber: data.user.rollNumber ?? u.roll_number,
      });
      window.location.href = '/dashboard';
    } catch (e) {
      alert(e.message || 'Impersonation failed');
    }
  };

  const executePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('campus_connect_token');
      const response = await fetch(`/api/super/users/${selectedUser.id}/force-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      alert(`✅ Password reset successfully for ${selectedUser.name}\nNew password: ${newPassword}`);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      
    } catch (err) {
      console.error('Password reset error:', err);
      setPasswordError(err.message);
    }
  };

  const handleStatusChange = (proposalId, newStatus) => {
    setStatusChanges(prev => ({
      ...prev,
      [proposalId]: newStatus
    }));
  };

  const executeStatusChange = async (proposal) => {
    const newStatus = statusChanges[proposal.id];
    
    if (!newStatus) {
      alert('Please select a status first');
      return;
    }

    if (!window.confirm(
      `⚠️ FORCE CHANGE PROPOSAL STATUS?\n\n` +
      `Proposal: ${proposal.title}\n` +
      `Current: ${proposal.current_status}\n` +
      `New: ${newStatus}\n\n` +
      `This bypasses the normal workflow. Continue?`
    )) {
      return;
    }

    try {
      const token = localStorage.getItem('campus_connect_token');
      const response = await fetch(`/api/super/proposals/${proposal.id}/force-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change status');
      }

      alert(`✅ Proposal status changed: ${proposal.current_status} → ${newStatus}`);
      
      // Refresh data
      fetchData();
      
      // Clear selection
      setStatusChanges(prev => {
        const updated = { ...prev };
        delete updated[proposal.id];
        return updated;
      });
      
    } catch (err) {
      console.error('Status change error:', err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleResolveTicket = async (ticketId) => {
    if (!window.confirm('Mark this ticket as resolved?')) {
      return;
    }

    try {
      const token = localStorage.getItem('campus_connect_token');
      const response = await fetch(`/api/super/tickets/${ticketId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resolve ticket');
      }

      alert('✅ Ticket marked as resolved');
      
      // Refresh data
      fetchData();
      
    } catch (err) {
      console.error('Resolve ticket error:', err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'APPROVED') return 'status-approved';
    if (status === 'REJECTED') return 'status-rejected';
    if (status === 'RETURNED_FOR_REVISION') return 'status-returned';
    return 'status-pending';
  };

  if (loading) {
    return (
      <div className="super-admin-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading Control Centre...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="super-admin-dashboard">
        <div className="error-state">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={fetchData} className="btn-retry">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="super-admin-dashboard">
      {/* Header */}
      <div className="control-centre-header">
        <div className="header-content">
          <h1>🔧 THE CONTROL CENTRE</h1>
          <p className="header-subtitle">System Admin Dashboard - Full System Control</p>
        </div>
        <div className="header-stats">
          <div className="stat-box">
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{proposals.length}</span>
            <span className="stat-label">Total Proposals</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{tickets.filter(t => t.status === 'PENDING').length}</span>
            <span className="stat-label">Pending Tickets</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          📋 Proposal Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          💬 Support Tickets
        </button>
        <button 
          className={`tab-button ${activeTab === 'venues' ? 'active' : ''}`}
          onClick={() => setActiveTab('venues')}
        >
          🏛️ Venue Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ System Settings
        </button>
        <button 
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📜 Admin Logs
        </button>
      </div>

      {/* Main Content */}
      <div className="control-centre-content">
        
        {/* TABLE 1: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <section className="control-section">
            <div className="section-header">
              <h2>👥 USER MANAGEMENT</h2>
              <button onClick={fetchData} className="btn-refresh">🔄 Refresh</button>
            </div>
            
            <div className="overflow-x-auto whitespace-nowrap scrollbar-thin">
              <table className="control-table min-w-full">
                <thead>
                  <tr>
                    <th className="hidden sm:table-cell">ID</th>
                    <th className="text-left">Name</th>
                    <th className="hidden sm:table-cell">Email</th>
                    <th className="text-left">Role</th>
                    <th className="text-left">Change role</th>
                    <th className="hidden sm:table-cell">Impersonate</th>
                    <th className="text-left">Status</th>
                    <th className="hidden md:table-cell">Created</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="no-data">No users found</td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className="role-badge">{u.role}</span></td>
                        <td>
                          <div className="role-change-cell">
                            <select
                              value={roleSelections[u.id] ?? u.role}
                              onChange={(e) =>
                                setRoleSelections((prev) => ({ ...prev, [u.id]: e.target.value }))
                              }
                              className="role-select"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSaveRole(u)}
                              className="btn-action btn-small"
                              disabled={(roleSelections[u.id] ?? u.role) === u.role}
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleImpersonate(u)}
                            className="btn-action btn-small"
                            disabled={u.id === user.id}
                            title="Open portal as this user"
                          >
                            Impersonate
                          </button>
                        </td>
                        <td>
                          <span className={`status-indicator ${u.is_active ? 'active' : 'inactive'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{formatDate(u.created_at)}</td>
                        <td>
                          <button 
                            onClick={() => handleForcePasswordReset(u)}
                            className="btn-action btn-password"
                            title="Force reset password (no old password required)"
                          >
                            🔑 Force Reset Password
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TABLE 2: STUCK PROPOSALS */}
        {activeTab === 'proposals' && (
          <section className="control-section">
            <div className="section-header">
              <h2>📋 PROPOSAL MANAGEMENT (FORCE STATUS CHANGE)</h2>
              <button onClick={fetchData} className="btn-refresh">🔄 Refresh</button>
            </div>
            
            <div className="overflow-x-auto whitespace-nowrap scrollbar-thin">
              <table className="control-table min-w-full">
                <thead>
                  <tr>
                    <th className="hidden sm:table-cell">ID</th>
                    <th className="text-left">Title</th>
                    <th className="hidden sm:table-cell">Society</th>
                    <th className="hidden md:table-cell">Created By</th>
                    <th className="text-left">Current Status</th>
                    <th className="hidden md:table-cell">Created</th>
                    <th className="text-left">Force Change Status</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">No proposals found</td>
                    </tr>
                  ) : (
                    proposals.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td className="proposal-title">{p.title}</td>
                        <td>{p.society_name}</td>
                        <td>{p.created_by_name}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(p.current_status)}`}>
                            {p.current_status}
                          </span>
                        </td>
                        <td>{formatDate(p.created_at)}</td>
                        <td>
                          <div className="status-change-controls">
                            <select 
                              value={statusChanges[p.id] || ''}
                              onChange={(e) => handleStatusChange(p.id, e.target.value)}
                              className="status-dropdown"
                            >
                              <option value="">-- Select Status --</option>
                              {PROPOSAL_STATUSES.map(status => (
                                <option 
                                  key={status} 
                                  value={status}
                                  disabled={status === p.current_status}
                                >
                                  {status}
                                </option>
                              ))}
                            </select>
                            <button 
                              onClick={() => executeStatusChange(p)}
                              className="btn-action btn-execute"
                              disabled={!statusChanges[p.id]}
                              title="Force change proposal status (bypasses workflow)"
                            >
                              ⚡ Execute
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TABLE 3: SUPPORT TICKETS (MODULE 3) */}
        {activeTab === 'tickets' && (
          <section className="control-section">
            <div className="section-header">
              <h2>💬 SUPPORT TICKETS (FEEDBACK & ISSUES)</h2>
              <button onClick={fetchData} className="btn-refresh">🔄 Refresh</button>
            </div>
            
            <div className="overflow-x-auto whitespace-nowrap scrollbar-thin">
              <table className="control-table min-w-full">
                <thead>
                  <tr>
                    <th className="hidden sm:table-cell">ID</th>
                    <th className="text-left">Date</th>
                    <th className="hidden sm:table-cell">Submitted By</th>
                    <th className="text-left">Subject</th>
                    <th className="hidden md:table-cell">Message</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">No support tickets found</td>
                    </tr>
                  ) : (
                    tickets.map(ticket => (
                      <tr 
                        key={ticket.id}
                        className={ticket.status === 'RESOLVED' ? 'ticket-resolved' : ''}
                      >
                        <td>{ticket.id}</td>
                        <td>{formatDate(ticket.created_at)}</td>
                        <td>
                          <div className="ticket-user-info">
                            <strong>{ticket.user_name}</strong>
                            <br />
                            <small>{ticket.user_email}</small>
                            <br />
                            <span className="role-badge-small">{ticket.user_role}</span>
                          </div>
                        </td>
                        <td>
                          <strong>{ticket.subject}</strong>
                        </td>
                        <td>
                          <div className="ticket-message">
                            {ticket.message.length > 100 
                              ? ticket.message.substring(0, 100) + '...' 
                              : ticket.message}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${ticket.status === 'RESOLVED' ? 'status-resolved' : 'status-pending-ticket'}`}>
                            {ticket.status}
                          </span>
                          {ticket.status === 'RESOLVED' && ticket.resolved_at && (
                            <div className="ticket-resolved-info">
                              <small>Resolved: {formatDate(ticket.resolved_at)}</small>
                              {ticket.resolved_by_name && (
                                <small>By: {ticket.resolved_by_name}</small>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {ticket.status === 'PENDING' ? (
                            <button 
                              onClick={() => handleResolveTicket(ticket.id)}
                              className="btn-action btn-resolve"
                              title="Mark ticket as resolved"
                            >
                              ✓ Mark Resolved
                            </button>
                          ) : (
                            <span className="ticket-resolved-label">✓ Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TABLE 4: VENUE MANAGEMENT */}
        {activeTab === 'venues' && (
          <VenueManagement />
        )}

        {/* TABLE 5: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <section className="control-section">
            <div className="section-header">
              <h2>⚙️ SYSTEM SETTINGS</h2>
              <button onClick={fetchData} className="btn-refresh">🔄 Refresh</button>
            </div>

            <div className="super-admin-settings-grid">

              {/* Global Freeze */}
              <div className="settings-card">
                <h3>🔒 Global Freeze</h3>
                <p>
                  When enabled, no new proposals can be submitted by any society.
                </p>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settingsForm.freeze}
                    onChange={e => setSettingsForm(f => ({ ...f, freeze: e.target.checked }))}
                    className="settings-toggle"
                  />
                  <span>
                    {settingsForm.freeze ? '🔴 System is FROZEN' : '🟢 System is ACTIVE'}
                  </span>
                </label>
              </div>

              {/* Announcement Banner */}
              <div className="settings-card">
                <h3>📢 Announcement Banner</h3>
                <p>
                  Displays a banner at the top of the page for all users. Leave empty to hide.
                </p>
                <div className="form-group settings-field">
                  <label htmlFor="announcement-text">Announcement Text</label>
                  <input
                    id="announcement-text"
                    type="text"
                    value={settingsForm.announcement}
                    onChange={e => setSettingsForm(f => ({ ...f, announcement: e.target.value }))}
                    placeholder="e.g. System maintenance on Friday 10pm–12am"
                    className="form-input settings-text-input"
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={async () => {
                  setSettingsSaving(true);
                  try {
                    const token = localStorage.getItem('campus_connect_token');
                    const res = await fetch('/api/super/system/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({
                        freeze: settingsForm.freeze,
                        announcement: settingsForm.announcement,
                        color: settingsForm.color
                      })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert('✅ System settings saved successfully');
                      fetchData();
                    } else {
                      alert(`❌ Error: ${data.error}`);
                    }
                  } catch (err) {
                    alert(`❌ Network error: ${err.message}`);
                  } finally {
                    setSettingsSaving(false);
                  }
                }}
                className="btn-action btn-execute settings-save-btn"
                disabled={settingsSaving}
              >
                {settingsSaving ? '⏳ Saving...' : '💾 Save Settings'}
              </button>

              {/* Danger Zone: Academic Year Rollover */}
              <div className="danger-card">
                <h3>⚠️ Danger Zone</h3>
                <p>
                  <strong>Academic Year Rollover:</strong> Archives all proposals, resets society budgets, and demotes society leaders to students. This action cannot be undone.
                </p>
                <button
                  onClick={async () => {
                    if (!window.confirm(
                      '⚠️ ACADEMIC YEAR ROLLOVER\n\n' +
                      'This will:\n' +
                      '• Archive ALL proposals\n' +
                      '• Reset ALL society budgets to 0\n' +
                      '• Demote ALL society leaders to STUDENT role\n\n' +
                      'This CANNOT be undone. Are you absolutely sure?'
                    )) return;
                    if (!window.confirm('Final confirmation: Type YES to proceed.\n\nAre you sure?')) return;
                    try {
                      const token = localStorage.getItem('campus_connect_token');
                      const res = await fetch('/api/super/system/rollover', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      const data = await res.json();
                      if (res.ok) {
                        alert(`✅ Rollover complete!\n\nProposals archived: ${data.stats.proposalsArchived}\nSocieties reset: ${data.stats.societiesReset}\nUsers demoted: ${data.stats.usersReset}`);
                        fetchData();
                      } else {
                        alert(`❌ Error: ${data.error}`);
                      }
                    } catch (err) {
                      alert(`❌ Network error: ${err.message}`);
                    }
                  }}
                  className="danger-action-btn"
                >
                  🔄 Execute Academic Year Rollover
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TABLE 6: ADMIN LOGS */}
        {activeTab === 'logs' && (
          <section className="control-section">
            <div className="section-header">
              <h2>📜 ADMIN ACTION LOGS</h2>
              <button onClick={fetchData} className="btn-refresh">🔄 Refresh</button>
            </div>

            <div className="overflow-x-auto whitespace-nowrap scrollbar-thin">
              <table className="control-table min-w-full">
                <thead>
                  <tr>
                    <th className="hidden sm:table-cell">Time</th>
                    <th className="text-left">Admin</th>
                    <th className="text-left">Action</th>
                    <th className="text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-data">No admin logs found</td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{formatDate(log.timestamp)}</td>
                        <td>
                          <strong>{log.admin_name}</strong>
                          <br /><small>{log.admin_email}</small>
                        </td>
                        <td>
                          <span className="role-badge" style={{ fontSize: '11px' }}>{log.action_type}</span>
                        </td>
                        <td style={{ fontSize: '13px' }}>{log.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>

      {/* PASSWORD RESET MODAL */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔑 Force Password Reset</h2>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-info-box">
                <p><strong>User:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="text"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter new password (min 6 characters)"
                  className="form-input"
                  autoFocus
                />
                {passwordError && (
                  <p className="error-message">{passwordError}</p>
                )}
              </div>

              <div className="warning-box">
                <p>⚠️ <strong>WARNING:</strong> This will immediately change the user's password without requiring their old password. The user will need to use this new password to log in.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={executePasswordReset}
                className="btn-primary"
                disabled={!newPassword || newPassword.length < 6}
              >
                Force Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
