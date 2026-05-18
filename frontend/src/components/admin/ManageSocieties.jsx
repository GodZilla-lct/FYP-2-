import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/auth';
import './ManageSocieties.css';

const ManageSocieties = ({ user }) => {
  const [activeTab, setActiveTab] = useState('societies');
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSociety, setEditingSociety] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    coordinator_id: ''
  });
  const [coordinators, setCoordinators] = useState([]);

  // Coordinator management state
  const [coordList, setCoordList] = useState([]);
  const [showAddCoordForm, setShowAddCoordForm] = useState(false);
  const [coordForm, setCoordForm] = useState({ name: '', email: '', password: '' });
  const [coordLoading, setCoordLoading] = useState(false);
  const [coordError, setCoordError] = useState('');
  const [coordSuccess, setCoordSuccess] = useState('');

  // DIRECTOR_SSC and SYSTEM_ADMIN can assign coordinators (matches backend authorization)
  // ASST_DIRECTOR can edit society name but NOT assign coordinators
  const canModify = ['DIRECTOR_SSC', 'ASST_DIRECTOR'].includes(user.role);
  const canAssignCoordinator = ['DIRECTOR_SSC', 'SYSTEM_ADMIN'].includes(user.role);
  const canManageCoordinators = ['DIRECTOR_SSC', 'SYSTEM_ADMIN'].includes(user.role);
  
  // Determine access level for UI display
  const accessLevel = canModify ? 'Read/Write' : 'Read-Only';

  useEffect(() => {
    fetchSocieties();
    fetchCoordinators();
    fetchCoordList();
  }, []);

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/societies', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        // Real data from seeded CSV - NO hardcoded names
        setSocieties(data.societies || []);
      } else {
        console.error('Failed to fetch societies');
      }
    } catch (err) {
      console.error('Error fetching societies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinators = async () => {
    try {
      const response = await fetch('/api/coordinators', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCoordinators(data.coordinators || []);
      }
    } catch (err) {
      console.error('Error fetching coordinators:', err);
    }
  };

  const fetchCoordList = async () => {
    try {
      const response = await fetch('/api/users/coordinators', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCoordList(data.coordinators || []);
      }
    } catch (err) {
      console.error('Error fetching coordinator list:', err);
    }
  };

  const handleCreateCoordinator = async (e) => {
    e.preventDefault();
    setCoordError('');
    setCoordSuccess('');
    setCoordLoading(true);

    try {
      const response = await fetch('/api/users/coordinators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(coordForm)
      });

      const data = await response.json();

      if (response.ok) {
        setCoordSuccess(`✅ Coordinator account created for ${coordForm.name}. They can now log in with their email and password.`);
        setCoordForm({ name: '', email: '', password: '' });
        setShowAddCoordForm(false);
        fetchCoordList();
        fetchCoordinators(); // refresh dropdown too
      } else {
        setCoordError(data.message || data.error || 'Failed to create coordinator');
      }
    } catch (err) {
      setCoordError('Network error. Please try again.');
    } finally {
      setCoordLoading(false);
    }
  };

  const handleDeleteCoordinator = async (coordId, coordName) => {
    if (!window.confirm(
      `Deactivate coordinator "${coordName}"?\n\nThis will:\n• Disable their login\n• Remove them from all assigned societies\n\nThis can be reversed by the System Admin.`
    )) return;

    try {
      const response = await fetch(`/api/users/coordinators/${coordId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        setCoordSuccess(`✅ ${data.message}`);
        fetchCoordList();
        fetchCoordinators();
        fetchSocieties();
      } else {
        setCoordError(data.error || 'Failed to deactivate coordinator');
      }
    } catch (err) {
      setCoordError('Network error. Please try again.');
    }
  };

  const handleAddSociety = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/societies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: formData.name,
          coordinator_id: formData.coordinator_id || null
        })
      });

      if (response.ok) {
        alert('Society added successfully!');
        setShowAddForm(false);
        setFormData({ name: '', coordinator_id: '' });
        fetchSocieties();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add society');
      }
    } catch (err) {
      console.error('Error adding society:', err);
      alert('Failed to add society');
    }
  };

  const handleUpdateSociety = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/societies/${editingSociety.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: formData.name,
          coordinator_id: formData.coordinator_id || null
        })
      });

      if (response.ok) {
        alert('Society updated successfully!');
        setEditingSociety(null);
        setFormData({ name: '', coordinator_id: '' });
        fetchSocieties();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update society');
      }
    } catch (err) {
      console.error('Error updating society:', err);
      alert('Failed to update society');
    }
  };

  const handleEditClick = (society) => {
    setEditingSociety(society);
    setFormData({
      name: society.name,
      coordinator_id: society.coordinator_id || ''
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingSociety(null);
    setFormData({ name: '', coordinator_id: '' });
  };

  const handleCoordinatorChange = async (societyId, coordinatorId) => {
    try {
      const response = await fetch(`/api/societies/${societyId}/coordinator`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          coordinatorId: coordinatorId || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Coordinator updated successfully!');
        fetchSocieties();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update coordinator');
      }
    } catch (err) {
      console.error('Error updating coordinator:', err);
      alert('Failed to update coordinator');
    }
  };

  const handleDeleteSociety = async (societyId, societyName) => {
    if (!window.confirm(`Are you sure you want to delete "${societyName}"? This will also delete all associated proposals and roles.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/societies/${societyId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        alert('Society deleted successfully!');
        fetchSocieties();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete society');
      }
    } catch (err) {
      console.error('Error deleting society:', err);
      alert('Failed to delete society');
    }
  };

  if (loading) {
    return <div className="manage-societies-loading">Loading societies...</div>;
  }

  return (
    <div className="manage-societies-container">
      <div className="manage-societies-header">
        <div className="header-title-section">
          <h2>🏛️ {canModify ? 'Manage' : 'View'} Societies</h2>
          <span className={`access-badge ${canModify ? 'write' : 'readonly'}`}>
            {accessLevel}
          </span>
        </div>

        {/* Tab action buttons */}
        {activeTab === 'societies' && canModify && (
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingSociety(null);
              setFormData({ name: '', coordinator_id: '' });
            }}
            className="btn btn-primary"
          >
            {showAddForm ? '✕ Cancel' : '+ Add New Society'}
          </button>
        )}
        {activeTab === 'coordinators' && canManageCoordinators && (
          <button
            onClick={() => { setShowAddCoordForm(!showAddCoordForm); setCoordError(''); setCoordSuccess(''); }}
            className="btn btn-primary"
          >
            {showAddCoordForm ? '✕ Cancel' : '+ Add Coordinator'}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-button ${activeTab === 'societies' ? 'active' : ''}`}
          onClick={() => setActiveTab('societies')}
        >
          🏛️ Societies ({societies.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'coordinators' ? 'active' : ''}`}
          onClick={() => setActiveTab('coordinators')}
        >
          👔 Coordinators ({coordList.length})
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SOCIETIES                                              */}
      {/* ============================================================ */}
      {activeTab === 'societies' && (
        <>
          {/* Read-Only Notice */}
          {!canModify && (
            <div className="readonly-notice">
              <div className="notice-icon">ℹ️</div>
              <div className="notice-content">
                <h4>Read-Only Access</h4>
                <p>You have view-only access. Only Director SSC and Assistant Director can create, edit, or delete societies.</p>
              </div>
            </div>
          )}

          {/* Add Society Form */}
          {showAddForm && canModify && (
            <div className="society-form-card">
              <h3>Add New Society</h3>
              <form onSubmit={handleAddSociety}>
                <div className="form-group">
                  <label>Society Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Hayatian Blood Society"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Coordinator (Optional)</label>
                  {canAssignCoordinator ? (
                    <select
                      value={formData.coordinator_id}
                      onChange={(e) => setFormData({ ...formData, coordinator_id: e.target.value })}
                    >
                      <option value="">-- No Coordinator (proposals skip to Director SSC) --</option>
                      {coordinators.map(coord => (
                        <option key={coord.id} value={coord.id}>
                          {coord.name} ({coord.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p style={{ color: '#aaa', fontSize: '13px' }}>Only Director SSC can assign coordinators.</p>
                  )}
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Society</button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Society Form */}
          {editingSociety && canModify && (
            <div className="society-form-card editing">
              <h3>Edit Society: {editingSociety.name}</h3>
              <form onSubmit={handleUpdateSociety}>
                <div className="form-group">
                  <label>Society Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Coordinator (Optional)</label>
                  {canAssignCoordinator ? (
                    <select
                      value={formData.coordinator_id}
                      onChange={(e) => setFormData({ ...formData, coordinator_id: e.target.value })}
                    >
                      <option value="">-- No Coordinator (proposals skip to Director SSC) --</option>
                      {coordinators.map(coord => (
                        <option key={coord.id} value={coord.id}>
                          {coord.name} ({coord.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p style={{ color: '#aaa', fontSize: '13px' }}>Only Director SSC can assign coordinators.</p>
                  )}
                </div>
                <div className="form-actions">
                  <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Society</button>
                </div>
              </form>
            </div>
          )}

          {/* Societies Grid */}
          <div className="societies-grid">
            {societies.length === 0 ? (
              <div className="no-societies">
                <p>No societies found. Add your first society above!</p>
              </div>
            ) : (
              societies.map(society => (
                <div key={society.id} className="society-card">
                  <div className="society-card-header">
                    <h3>{society.name}</h3>
                    {canModify && (
                      <div className="society-actions">
                        <button onClick={() => handleEditClick(society)} className="btn-icon" title="Edit society">✏️</button>
                        <button onClick={() => handleDeleteSociety(society.id, society.name)} className="btn-icon btn-danger" title="Delete society">🗑️</button>
                      </div>
                    )}
                  </div>
                  <div className="society-card-body">
                    <div className="society-info">
                      <span className="info-label">Coordinator:</span>
                      {canAssignCoordinator ? (
                        <select
                          className="coordinator-dropdown"
                          value={society.coordinator_id || ''}
                          onChange={(e) => handleCoordinatorChange(society.id, e.target.value)}
                          title="Assign coordinator to this society"
                        >
                          <option value="">None (Skip Stage)</option>
                          {coordinators.map(coord => (
                            <option key={coord.id} value={coord.id}>{coord.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="info-value">{society.coordinator_name || 'Not assigned'}</span>
                      )}
                    </div>
                    <div className="society-info">
                      <span className="info-label">Members:</span>
                      <span className="info-value">{society.member_count || 0} members</span>
                    </div>
                    <div className="society-info">
                      <span className="info-label">Proposals:</span>
                      <span className="info-value">{society.proposal_count || 0} proposals</span>
                    </div>
                    {society.roles && society.roles.filter(r => r.is_core_leader).length > 0 && (
                      <div className="cabinet-members-section">
                        <h4 className="cabinet-title">Core Cabinet:</h4>
                        <div className="cabinet-list">
                          {society.roles.filter(r => r.is_core_leader).map((role, idx) => (
                            <div key={idx} className="cabinet-member">
                              <span className="member-role">{role.role_name}:</span>
                              <span className="member-name">{role.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="societies-summary">
            <p>Total Societies: <strong>{societies.length}</strong></p>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: COORDINATORS                                           */}
      {/* ============================================================ */}
      {activeTab === 'coordinators' && (
        <div className="coordinators-tab">

          {/* Feedback messages */}
          {coordError && (
            <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
              ❌ {coordError}
              <button onClick={() => setCoordError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
            </div>
          )}
          {coordSuccess && (
            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
              {coordSuccess}
              <button onClick={() => setCoordSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
            </div>
          )}

          {/* Add Coordinator Form */}
          {showAddCoordForm && canManageCoordinators && (
            <div className="society-form-card" style={{ marginBottom: '24px' }}>
              <h3>👔 Create Coordinator Account</h3>
              <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>
                This creates a login account with the COORDINATOR role. Once created, they will appear in the coordinator dropdown for societies.
              </p>
              <form onSubmit={handleCreateCoordinator}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={coordForm.name}
                      onChange={(e) => setCoordForm({ ...coordForm, name: e.target.value })}
                      placeholder="e.g., Dr. Ahmed Khan"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      value={coordForm.email}
                      onChange={(e) => setCoordForm({ ...coordForm, email: e.target.value })}
                      placeholder="e.g., ahmed.khan@uog.edu.pk"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Password *</label>
                    <input
                      type="text"
                      value={coordForm.password}
                      onChange={(e) => setCoordForm({ ...coordForm, password: e.target.value })}
                      placeholder="Min 6 characters"
                      minLength={6}
                      required
                    />
                    <small style={{ color: '#aaa' }}>Share this password with the coordinator. They can change it after login.</small>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => { setShowAddCoordForm(false); setCoordError(''); }} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={coordLoading}>
                    {coordLoading ? '⏳ Creating...' : '✅ Create Coordinator Account'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Coordinators Table */}
          {coordList.length === 0 ? (
            <div className="no-societies" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>👔 No coordinators yet.</p>
              {canManageCoordinators && (
                <p style={{ color: '#aaa' }}>Click <strong>"+ Add Coordinator"</strong> above to create the first coordinator account.</p>
              )}
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: '#ccc', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '12px 16px', color: '#ccc', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '12px 16px', color: '#ccc', fontWeight: '600' }}>Assigned Society</th>
                    <th style={{ padding: '12px 16px', color: '#ccc', fontWeight: '600' }}>Status</th>
                    {canManageCoordinators && (
                      <th style={{ padding: '12px 16px', color: '#ccc', fontWeight: '600' }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {coordList.map(coord => (
                    <tr key={coord.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '500' }}>
                        👔 {coord.name}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#ccc' }}>{coord.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {coord.society_name ? (
                          <span style={{ background: 'rgba(102,126,234,0.3)', color: '#a0b4ff', padding: '3px 10px', borderRadius: '12px', fontSize: '13px' }}>
                            🏛️ {coord.society_name}
                          </span>
                        ) : (
                          <span style={{ color: '#888', fontSize: '13px' }}>Not assigned</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: coord.is_active ? 'rgba(40,167,69,0.2)' : 'rgba(220,53,69,0.2)',
                          color: coord.is_active ? '#5cb85c' : '#d9534f',
                          padding: '3px 10px', borderRadius: '12px', fontSize: '13px'
                        }}>
                          {coord.is_active ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                      </td>
                      {canManageCoordinators && (
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => handleDeleteCoordinator(coord.id, coord.name)}
                            style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                            title="Deactivate this coordinator"
                          >
                            🗑️ Deactivate
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '16px', color: '#888', fontSize: '13px' }}>
            Total Coordinators: <strong style={{ color: '#fff' }}>{coordList.length}</strong>
            {coordList.filter(c => c.society_name).length > 0 && (
              <> · Assigned: <strong style={{ color: '#5cb85c' }}>{coordList.filter(c => c.society_name).length}</strong></>
            )}
            {coordList.filter(c => !c.society_name).length > 0 && (
              <> · Unassigned: <strong style={{ color: '#f0ad4e' }}>{coordList.filter(c => !c.society_name).length}</strong></>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSocieties;
