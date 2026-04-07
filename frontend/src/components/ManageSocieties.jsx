import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../utils/auth';
import './ManageSocieties.css';

const ManageSocieties = ({ user }) => {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSociety, setEditingSociety] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    coordinator_id: ''
  });
  const [coordinators, setCoordinators] = useState([]);

  // CRITICAL: Determine if user has write permissions
  // Only DIRECTOR_SSC and ASST_DIRECTOR can modify societies
  const canModify = ['DIRECTOR_SSC', 'ASST_DIRECTOR'].includes(user.role);
  
  // Determine access level for UI display
  const accessLevel = canModify ? 'Read/Write' : 'Read-Only';

  useEffect(() => {
    fetchSocieties();
    fetchCoordinators();
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
      const response = await fetch('/api/users/by-role/COORDINATOR', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCoordinators(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching coordinators:', err);
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
        
        {/* CRITICAL: Only show "Add New Society" button if user can modify */}
        {canModify && (
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
      </div>

      {/* Read-Only Notice for non-modifying users */}
      {!canModify && (
        <div className="readonly-notice">
          <div className="notice-icon">ℹ️</div>
          <div className="notice-content">
            <h4>Read-Only Access</h4>
            <p>
              You have view-only access to societies. Only the Director SSC and Assistant Director 
              can create, edit, or delete societies.
            </p>
          </div>
        </div>
      )}

      {/* Add Society Form - ONLY for users with modify permission */}
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
              <select
                value={formData.coordinator_id}
                onChange={(e) => setFormData({ ...formData, coordinator_id: e.target.value })}
              >
                <option value="">-- No Coordinator --</option>
                {coordinators.map(coord => (
                  <option key={coord.id} value={coord.id}>
                    {coord.name} ({coord.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Society
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Society Form - ONLY for users with modify permission */}
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
              <select
                value={formData.coordinator_id}
                onChange={(e) => setFormData({ ...formData, coordinator_id: e.target.value })}
              >
                <option value="">-- No Coordinator --</option>
                {coordinators.map(coord => (
                  <option key={coord.id} value={coord.id}>
                    {coord.name} ({coord.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Update Society
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Societies List */}
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
                
                {/* CRITICAL: Only show action buttons if user can modify */}
                {canModify && (
                  <div className="society-actions">
                    <button 
                      onClick={() => handleEditClick(society)}
                      className="btn-icon"
                      title="Edit society"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteSociety(society.id, society.name)}
                      className="btn-icon btn-danger"
                      title="Delete society"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              <div className="society-card-body">
                <div className="society-info">
                  <span className="info-label">Coordinator:</span>
                  <span className="info-value">
                    {society.coordinator_name || 'Not assigned'}
                  </span>
                </div>
                <div className="society-info">
                  <span className="info-label">Members:</span>
                  <span className="info-value">
                    {society.member_count || 0} members
                  </span>
                </div>
                <div className="society-info">
                  <span className="info-label">Proposals:</span>
                  <span className="info-value">
                    {society.proposal_count || 0} proposals
                  </span>
                </div>
                
                {/* Display Core Cabinet Members from Real CSV Data */}
                {society.roles && society.roles.length > 0 && (
                  <div className="cabinet-members-section">
                    <h4 className="cabinet-title">Core Cabinet:</h4>
                    <div className="cabinet-list">
                      {society.roles
                        .filter(role => role.is_core_leader)
                        .map((role, idx) => (
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
    </div>
  );
};

export default ManageSocieties;
