import React, { useState, useEffect } from 'react';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Status change states
  const [statusChanges, setStatusChanges] = useState({}); // { proposalId: selectedStatus }
  
  // All 6 system statuses
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
      
      // Fetch users
      const usersResponse = await fetch('/api/super/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);
      
      // Fetch proposals
      const proposalsResponse = await fetch('/api/super/proposals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!proposalsResponse.ok) throw new Error('Failed to fetch proposals');
      const proposalsData = await proposalsResponse.json();
      setProposals(proposalsData.proposals || []);
      
      // Fetch support tickets (MODULE 3)
      const ticketsResponse = await fetch('/api/super/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!ticketsResponse.ok) throw new Error('Failed to fetch tickets');
      const ticketsData = await ticketsResponse.json();
      setTickets(ticketsData.tickets || []);
      
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

      {/* Main Content */}
      <div className="control-centre-content">
        
        {/* TABLE 1: USER MANAGEMENT */}
        <section className="control-section">
          <div className="section-header">
            <h2>👥 USER MANAGEMENT</h2>
            <button onClick={fetchData} className="btn-refresh">🔄 Refresh</button>
          </div>
          
          <div className="table-container">
            <table className="control-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">No users found</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className="role-badge">{u.role}</span></td>
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

        {/* TABLE 2: STUCK PROPOSALS */}
        <section className="control-section">
          <div className="section-header">
            <h2>📋 PROPOSAL MANAGEMENT (FORCE STATUS CHANGE)</h2>
            <button onClick={fetchData} className="btn-refresh">🔄 Refresh</button>
          </div>
          
          <div className="table-container">
            <table className="control-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Society</th>
                  <th>Created By</th>
                  <th>Current Status</th>
                  <th>Created</th>
                  <th>Force Change Status</th>
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

        {/* TABLE 3: SUPPORT TICKETS (MODULE 3) */}
        <section className="control-section">
          <div className="section-header">
            <h2>💬 SUPPORT TICKETS (FEEDBACK & ISSUES)</h2>
            <button onClick={fetchData} className="btn-refresh">🔄 Refresh</button>
          </div>
          
          <div className="table-container">
            <table className="control-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Submitted By</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
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
