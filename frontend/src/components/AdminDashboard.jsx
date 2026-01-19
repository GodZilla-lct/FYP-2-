import { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { getAuthHeaders } from '../utils/auth';

const AdminDashboard = ({ user }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [actionData, setActionData] = useState({
    action: '',
    rejectionReason: '',
    rejectionType: 'SOFT'
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/proposals', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }

      const data = await response.json();
      setProposals(data.proposals || []);
      
      console.log(`Admin Dashboard - Fetched ${data.proposals?.length || 0} proposals`);
    } catch (err) {
      setError('Failed to fetch proposals: ' + err.message);
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessProposal = async () => {
    if (!selectedProposal || !actionData.action) {
      setError('Please select an action');
      return;
    }

    if (actionData.action === 'REJECT' && !actionData.rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const requestBody = {
        proposalId: selectedProposal.id,
        action: actionData.action,
        rejectionReason: actionData.action === 'REJECT' ? actionData.rejectionReason : null,
        rejectionType: actionData.action === 'REJECT' ? actionData.rejectionType : null
      };

      const response = await fetch('/api/proposals/next-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Proposal ${actionData.action.toLowerCase()}ed successfully!`);
        setShowProcessModal(false);
        setSelectedProposal(null);
        setActionData({ action: '', rejectionReason: '', rejectionType: 'SOFT' });
        await fetchProposals(); // Refresh the list
      } else {
        setError(data.error || 'Failed to process proposal');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      console.error('Error processing proposal:', err);
    } finally {
      setLoading(false);
    }
  };

  const openProcessModal = (proposal) => {
    setSelectedProposal(proposal);
    setShowProcessModal(true);
    setActionData({ action: '', rejectionReason: '', rejectionType: 'SOFT' });
    setError('');
  };

  const closeProcessModal = () => {
    setShowProcessModal(false);
    setSelectedProposal(null);
    setActionData({ action: '', rejectionReason: '', rejectionType: 'SOFT' });
    setError('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#28a745';
      case 'REJECTED': return '#dc3545';
      case 'RETURNED_FOR_REVISION': return '#ffc107';
      case 'PENDING_COORDINATOR': return '#17a2b8';
      case 'PENDING_DIRECTOR_SSC': return '#fd7e14';
      case 'PENDING_ASST_DIRECTOR': return '#6f42c1';
      case 'PENDING_FINANCE_SECRETARY': return '#20c997';
      case 'PENDING_REGISTRAR': return '#e83e8c';
      case 'PENDING_VC': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING_COORDINATOR: 'Pending Coordinator',
      PENDING_DIRECTOR_SSC: 'Pending Director SSC',
      PENDING_ASST_DIRECTOR: 'Pending Assistant Director',
      PENDING_FINANCE_SECRETARY: 'Pending Finance Secretary',
      PENDING_REGISTRAR: 'Pending Registrar',
      PENDING_VC: 'Pending Vice Chancellor',
      APPROVED: 'Approved',
      RETURNED_FOR_REVISION: 'Returned for Revision',
      REJECTED: 'Rejected'
    };
    return labels[status] || status;
  };

  const canProcessProposal = (proposal) => {
    const userRole = user.role;
    const status = proposal.current_status;
    
    // Map user roles to the statuses they can process
    const roleStatusMap = {
      'COORDINATOR': ['PENDING_COORDINATOR'],
      'DIRECTOR_SSC': ['PENDING_DIRECTOR_SSC'],
      'ASST_DIRECTOR': ['PENDING_ASST_DIRECTOR'],
      'FINANCE_SECRETARY': ['PENDING_FINANCE_SECRETARY'],
      'REGISTRAR': ['PENDING_REGISTRAR'],
      'VC': ['PENDING_VC']
    };

    return roleStatusMap[userRole]?.includes(status) || false;
  };

  const getPendingProposals = () => {
    return proposals.filter(proposal => 
      proposal.current_status.startsWith('PENDING_') && 
      canProcessProposal(proposal)
    );
  };

  const getAllProposals = () => {
    return proposals;
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="user-info">
          <span>{user.name} ({user.role})</span>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading && !showProcessModal ? (
        <div className="loading">Loading proposals...</div>
      ) : (
        <>
          {/* Pending Approvals Section */}
          <div className="pending-approvals-section">
            <h2>Pending Approvals ({getPendingProposals().length})</h2>
            {getPendingProposals().length === 0 ? (
              <div className="no-pending">
                <p>No proposals pending your approval at this time.</p>
              </div>
            ) : (
              <div className="proposals-table-container">
                <table className="proposals-table">
                  <thead>
                    <tr>
                      <th>Society Name</th>
                      <th>Event Title</th>
                      <th>Date</th>
                      <th>Budget</th>
                      <th>Current Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPendingProposals().map((proposal) => (
                      <tr key={proposal.id} className="pending-row">
                        <td className="society-name">{proposal.society_name}</td>
                        <td className="proposal-title">{proposal.title}</td>
                        <td>{new Date(proposal.event_date).toLocaleDateString()}</td>
                        <td>PKR {proposal.budget_requested.toLocaleString()}</td>
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
                            className="btn btn-primary btn-sm"
                            onClick={() => openProcessModal(proposal)}
                          >
                            View/Process
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All Proposals Section */}
          <div className="all-proposals-section">
            <h2>All Proposals ({getAllProposals().length})</h2>
            {getAllProposals().length === 0 ? (
              <div className="no-proposals">
                <p>No proposals found in the system.</p>
              </div>
            ) : (
              <div className="proposals-table-container">
                <table className="proposals-table">
                  <thead>
                    <tr>
                      <th>Society Name</th>
                      <th>Event Title</th>
                      <th>President</th>
                      <th>Date</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getAllProposals().map((proposal) => (
                      <tr key={proposal.id}>
                        <td className="society-name">{proposal.society_name}</td>
                        <td className="proposal-title">{proposal.title}</td>
                        <td>{proposal.president_name || proposal.created_by_name}</td>
                        <td>{new Date(proposal.event_date).toLocaleDateString()}</td>
                        <td>PKR {proposal.budget_requested.toLocaleString()}</td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(proposal.current_status) }}
                          >
                            {getStatusLabel(proposal.current_status)}
                          </span>
                        </td>
                        <td>{new Date(proposal.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openProcessModal(proposal)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Process Proposal Modal */}
      {showProcessModal && selectedProposal && (
        <div className="modal-overlay">
          <div className="modal process-modal">
            <div className="modal-header">
              <h3>Process Proposal: {selectedProposal.title}</h3>
              <button className="close-btn" onClick={closeProcessModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="proposal-details">
                <div className="detail-row">
                  <strong>Society:</strong> {selectedProposal.society_name}
                </div>
                <div className="detail-row">
                  <strong>Event Date:</strong> {new Date(selectedProposal.event_date).toLocaleDateString()}
                </div>
                <div className="detail-row">
                  <strong>Budget:</strong> PKR {selectedProposal.budget_requested.toLocaleString()}
                </div>
                <div className="detail-row">
                  <strong>Current Status:</strong> 
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedProposal.current_status) }}
                  >
                    {getStatusLabel(selectedProposal.current_status)}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Description:</strong>
                  <p>{selectedProposal.description}</p>
                </div>
              </div>

              {canProcessProposal(selectedProposal) && (
                <div className="action-section">
                  <h4>Take Action</h4>
                  
                  <div className="form-group">
                    <label>Action:</label>
                    <select
                      value={actionData.action}
                      onChange={(e) => setActionData({...actionData, action: e.target.value})}
                    >
                      <option value="">Select Action</option>
                      <option value="APPROVE">Approve</option>
                      <option value="REJECT">Reject</option>
                    </select>
                  </div>

                  {actionData.action === 'REJECT' && (
                    <>
                      <div className="form-group">
                        <label>Rejection Type:</label>
                        <select
                          value={actionData.rejectionType}
                          onChange={(e) => setActionData({...actionData, rejectionType: e.target.value})}
                        >
                          <option value="SOFT">Soft Rejection (Can be edited)</option>
                          <option value="HARD">Hard Rejection (Final)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Rejection Reason:</label>
                        <textarea
                          value={actionData.rejectionReason}
                          onChange={(e) => setActionData({...actionData, rejectionReason: e.target.value})}
                          placeholder="Please provide a reason for rejection..."
                          rows="3"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeProcessModal}
                disabled={loading}
              >
                Close
              </button>
              {canProcessProposal(selectedProposal) && (
                <button
                  className="btn btn-primary"
                  onClick={handleProcessProposal}
                  disabled={loading || !actionData.action}
                >
                  {loading ? 'Processing...' : `${actionData.action} Proposal`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;