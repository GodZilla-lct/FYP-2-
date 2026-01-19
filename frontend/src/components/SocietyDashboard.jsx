import { useState, useEffect } from 'react';
import './SocietyDashboard.css';
import { getAuthHeaders } from '../utils/auth';

const SocietyDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('proposals');
  const [proposals, setProposals] = useState([]);
  const [cabinetMembers, setCabinetMembers] = useState([]);
  const [societyName, setSocietyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    budgetRequested: '',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProposals();
    fetchCabinetMembers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proposals/my-proposals', {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }

      const data = await response.json();
      setProposals(data.proposals || []);
      setSocietyName(data.society_name || 'Your Society');
    } catch (err) {
      setError('Failed to fetch proposals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCabinetMembers = async () => {
    try {
      const response = await fetch('/api/societies', {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cabinet members');
      }

      const data = await response.json();
      // Find current user's society
      const userSociety = data.societies?.find(society => 
        society.roles?.some(role => role.roll_number === user.roll_number)
      );
      
      if (userSociety) {
        setCabinetMembers(userSociety.roles || []);
        setSocietyName(userSociety.name);
      }
    } catch (err) {
      console.error('Failed to fetch cabinet members:', err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);

      // Create FormData for file upload
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('eventDate', formData.eventDate);
      formDataObj.append('budgetRequested', formData.budgetRequested);

      // Append files
      files.forEach((file) => {
        formDataObj.append('files', file);
      });

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formDataObj, // Don't set Content-Type header, let browser set it
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Proposal "${data.proposal.title}" created successfully!`);
        setFormData({ title: '', description: '', eventDate: '', budgetRequested: '' });
        setFiles([]);
        setShowCreateForm(false);
        
        // FIXED: Instantly refresh proposals list
        await fetchProposals();
      } else {
        setError(data.error || 'Failed to create proposal');
        if (data.details) {
          setError(`${data.error}: ${data.details}`);
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (proposalId) => {
    try {
      setLoading(true);
      const response = await fetch('/api/proposals/next-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          proposalId,
          action: 'RESUBMIT',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Proposal resubmitted successfully!');
        fetchProposals();
      } else {
        setError(data.error || 'Failed to resubmit proposal');
      }
    } catch (err) {
      setError('Failed to resubmit proposal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportHierarchyIssue = () => {
    alert('Please contact Director SSC office to update leadership details.');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return '#28a745';
      case 'REJECTED':
        return '#dc3545';
      case 'RETURNED_FOR_REVISION':
        return '#ffc107';
      case 'PENDING_COORDINATOR':
      case 'PENDING_DIRECTOR_SSC':
      case 'PENDING_ASST_DIRECTOR':
      case 'PENDING_FINANCE_SECRETARY':
      case 'PENDING_REGISTRAR':
      case 'PENDING_VC':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING_COORDINATOR: 'Waiting for Coordinator',
      PENDING_DIRECTOR_SSC: 'Waiting for Director SSC',
      PENDING_ASST_DIRECTOR: 'Waiting for Assistant Director',
      PENDING_FINANCE_SECRETARY: 'Waiting for Finance Secretary',
      PENDING_REGISTRAR: 'Waiting for Registrar',
      PENDING_VC: 'Waiting for VC',
      APPROVED: 'Approved',
      RETURNED_FOR_REVISION: 'Returned for Revision',
      REJECTED: 'Rejected (Final)',
    };
    return labels[status] || status;
  };

  const canEdit = (proposal) => {
    return proposal.current_status === 'RETURNED_FOR_REVISION' && proposal.rejection_type !== 'HARD';
  };

  const getCoreLeaders = () => {
    return cabinetMembers.filter(member => member.is_core_leader);
  };

  const getOtherMembers = () => {
    return cabinetMembers.filter(member => !member.is_core_leader);
  };

  const getRoleIcon = (roleName) => {
    switch (roleName.toUpperCase()) {
      case 'PRESIDENT': return '👑';
      case 'VICE_PRESIDENT': return '🎖️';
      case 'GENERAL_SECRETARY': return '📋';
      case 'MEDIA_HEAD': return '📱';
      case 'EVENT_COORDINATOR': return '🎉';
      case 'FINANCE_SECRETARY': return '💰';
      default: return '👤';
    }
  };

  return (
    <div className="society-dashboard">
      <div className="dashboard-header">
        <h1>{societyName} Dashboard</h1>
        <div className="user-info">
          <span>{user.name} ({user.roll_number})</span>
        </div>
        {activeTab === 'proposals' && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create New Proposal'}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          📄 My Proposals
        </button>
        <button
          className={`tab-btn ${activeTab === 'cabinet' ? 'active' : ''}`}
          onClick={() => setActiveTab('cabinet')}
        >
          👥 My Cabinet
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Proposals Tab */}
      {activeTab === 'proposals' && (
        <>
          {showCreateForm && (
            <div className="create-proposal-form">
              <h2>Create New Proposal</h2>
              <form onSubmit={handleCreateProposal}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Society Name</label>
                    <input
                      type="text"
                      value={societyName}
                      disabled
                      className="readonly-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Your Roll Number</label>
                    <input
                      type="text"
                      value={user.roll_number || 'N/A'}
                      disabled
                      className="readonly-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="title">Proposal Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter proposal title"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter detailed description of your proposal"
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="eventDate">Event Date *</label>
                    <input
                      type="date"
                      id="eventDate"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleFormChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="budgetRequested">Budget Requested (PKR) *</label>
                    <input
                      type="number"
                      id="budgetRequested"
                      name="budgetRequested"
                      value={formData.budgetRequested}
                      onChange={handleFormChange}
                      required
                      placeholder="0"
                      step="100"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="files">Upload Documents</label>
                  <input
                    type="file"
                    id="files"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  <small className="help-text">
                    Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB per file)
                  </small>
                  {files.length > 0 && (
                    <div className="file-list">
                      <p>Selected files:</p>
                      <ul>
                        {files.map((file, idx) => (
                          <li key={idx}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Proposal'}
                </button>
              </form>
            </div>
          )}

          <div className="proposals-list">
            <h2>Your Proposals</h2>
            {loading && !showCreateForm ? (
              <p className="loading">Loading proposals...</p>
            ) : proposals.length === 0 ? (
              <div className="no-proposals">
                <p>No proposals yet. Create your first proposal to get started!</p>
              </div>
            ) : (
              <div className="proposals-grid">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="proposal-card">
                    <div className="proposal-header">
                      <h3>{proposal.title}</h3>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(proposal.current_status) }}
                      >
                        {getStatusLabel(proposal.current_status)}
                      </span>
                    </div>

                    <div className="proposal-body">
                      <p className="description">{proposal.description}</p>

                      <div className="proposal-details">
                        <div className="detail-row">
                          <span className="label">Event Date:</span>
                          <span className="value">{new Date(proposal.event_date).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Budget:</span>
                          <span className="value">PKR {proposal.budget_requested.toLocaleString()}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Created By:</span>
                          <span className="value">{proposal.created_by_name} ({proposal.created_by_roll})</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Created:</span>
                          <span className="value">{new Date(proposal.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* FIXED: SOFT vs HARD rejection display */}
                      {proposal.current_status === 'RETURNED_FOR_REVISION' && (
                        <div className="rejection-section soft-rejection">
                          <h4>Returned for Revision</h4>
                          <p className="rejection-reason">{proposal.rejection_reason}</p>
                          {canEdit(proposal) && (
                            <button
                              className="btn btn-warning"
                              onClick={() => handleResubmit(proposal.id)}
                              disabled={loading}
                            >
                              Edit & Resubmit
                            </button>
                          )}
                        </div>
                      )}

                      {proposal.current_status === 'REJECTED' && (
                        <div className="rejection-section hard-rejection">
                          <h4>Rejected (Final)</h4>
                          <p className="rejection-reason">{proposal.rejection_reason}</p>
                          <p className="note">This proposal cannot be edited or resubmitted.</p>
                        </div>
                      )}

                      {proposal.attachments && proposal.attachments.length > 0 && (
                        <div className="attachments-section">
                          <h4>Attachments:</h4>
                          <ul className="attachments-list">
                            {proposal.attachments.map((attachment) => (
                              <li key={attachment.id}>
                                <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                                  {attachment.file_name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Cabinet Tab */}
      {activeTab === 'cabinet' && (
        <div className="cabinet-view">
          <div className="cabinet-header">
            <h2>👥 {societyName} Leadership Cabinet</h2>
            <p className="cabinet-subtitle">Read-only view of your society's leadership structure</p>
            <button
              className="btn btn-outline report-issue-btn"
              onClick={handleReportHierarchyIssue}
            >
              📞 Report Hierarchy Issue
            </button>
          </div>

          {/* Core Leadership */}
          <div className="leadership-section">
            <h3 className="section-title">🎯 Core Leadership</h3>
            {getCoreLeaders().length === 0 ? (
              <div className="no-members">
                <p>No core leadership members found.</p>
              </div>
            ) : (
              <div className="members-grid core">
                {getCoreLeaders().map((member) => (
                  <div key={member.id} className="member-card core-member">
                    <div className="member-icon">
                      {getRoleIcon(member.role_name)}
                    </div>
                    <div className="member-info">
                      <h4 className="member-name">{member.name}</h4>
                      <p className="member-role">{member.role_name}</p>
                      <p className="member-roll">{member.roll_number}</p>
                    </div>
                    <div className="core-badge">
                      <span>Core Leader</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Other Team Members */}
          {getOtherMembers().length > 0 && (
            <div className="leadership-section">
              <h3 className="section-title">📋 Other Team Members</h3>
              <div className="members-grid other">
                {getOtherMembers().map((member) => (
                  <div key={member.id} className="member-card other-member">
                    <div className="member-icon">
                      {getRoleIcon(member.role_name)}
                    </div>
                    <div className="member-info">
                      <h4 className="member-name">{member.name}</h4>
                      <p className="member-role">{member.role_name}</p>
                      <p className="member-roll">{member.roll_number}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="cabinet-info">
            <div className="info-card">
              <h4>ℹ️ About This View</h4>
              <ul>
                <li><strong>Read-Only:</strong> This is a view-only display of your society's leadership structure</li>
                <li><strong>Core Leaders:</strong> Can access the Society Dashboard and create proposals</li>
                <li><strong>Updates:</strong> Only Director SSC can modify leadership roles</li>
                <li><strong>Issues:</strong> Use "Report Hierarchy Issue" button for any corrections needed</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietyDashboard;