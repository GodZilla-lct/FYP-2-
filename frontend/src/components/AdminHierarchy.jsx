import { useState, useEffect } from 'react';
import './AdminHierarchy.css';
import { getAuthHeaders } from '../utils/auth';

const AdminHierarchy = ({ user }) => {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [editingRoles, setEditingRoles] = useState({});
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [editingSocietyId, setEditingSocietyId] = useState(null);
  const [newRole, setNewRole] = useState({
    studentName: '',
    rollNumber: '',
    roleName: '',
    isCoreLeader: false
  });

  useEffect(() => {
    if (user.role !== 'DIRECTOR_SSC') {
      setError('You do not have permission to access this page');
      return;
    }
    fetchSocieties();
  }, [user.role]);

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/societies', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch societies');
      }

      const data = await response.json();
      setSocieties(data.societies || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch societies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCardExpansion = (societyId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(societyId)) {
      newExpanded.delete(societyId);
    } else {
      newExpanded.add(societyId);
    }
    setExpandedCards(newExpanded);
  };

  const handleRoleEdit = (societyId, roleId, field, value) => {
    setEditingRoles(prev => ({
      ...prev,
      [`${societyId}-${roleId}-${field}`]: value
    }));
  };

  const saveRoleEdit = async (societyId, roleId, roleName) => {
    const nameKey = `${societyId}-${roleId}-name`;
    const rollKey = `${societyId}-${roleId}-roll`;
    
    const newName = editingRoles[nameKey];
    const newRoll = editingRoles[rollKey];

    if (!newName || !newRoll) {
      setError('Name and roll number are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/societies/${societyId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          studentName: newName,
          rollNumber: newRoll,
          roleName: roleName,
          isCoreLeader: ['PRESIDENT', 'VICE_PRESIDENT', 'GENERAL_SECRETARY'].includes(roleName)
        }),
      });

      if (response.ok) {
        setSuccess('Role updated successfully!');
        setEditingRoles(prev => {
          const newState = { ...prev };
          delete newState[nameKey];
          delete newState[rollKey];
          return newState;
        });
        fetchSocieties();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update role');
      }
    } catch (err) {
      setError('Failed to update role');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (societyId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/societies/${societyId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newRole),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Role added successfully! ${data.user.name} (${data.user.roll_number}) assigned as ${data.user.role_name}`);
        setShowAddRoleModal(false);
        setNewRole({ studentName: '', rollNumber: '', roleName: '', isCoreLeader: false });
        fetchSocieties();
      } else {
        setError(data.error || 'Failed to add role');
      }
    } catch (err) {
      setError(err.message || 'Failed to add role');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (societyId, roleId) => {
    if (!window.confirm('Are you sure you want to remove this role?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/societies/${societyId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setSuccess('Role removed successfully');
        fetchSocieties();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove role');
      }
    } catch (err) {
      setError(err.message || 'Failed to remove role');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPresident = (society) => {
    return society.roles?.find(role => role.role_name === 'PRESIDENT') || null;
  };

  const getCoreLeaders = (society) => {
    return society.roles?.filter(role => 
      role.is_core_leader && role.role_name !== 'PRESIDENT'
    ) || [];
  };

  const getOtherRoles = (society) => {
    return society.roles?.filter(role => !role.is_core_leader) || [];
  };

  const getSocietyColor = (index) => {
    const colors = [
      '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
      '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
      '#e91e63', '#00bcd4', '#4caf50', '#ff9800'
    ];
    return colors[index % colors.length];
  };

  const openAddRoleModal = (societyId) => {
    setEditingSocietyId(societyId);
    setShowAddRoleModal(true);
    setNewRole({ studentName: '', rollNumber: '', roleName: '', isCoreLeader: false });
  };

  const closeAddRoleModal = () => {
    setShowAddRoleModal(false);
    setEditingSocietyId(null);
    setNewRole({ studentName: '', rollNumber: '', roleName: '', isCoreLeader: false });
  };

  const handleNewRoleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRole(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (user.role !== 'DIRECTOR_SSC') {
    return (
      <div className="admin-hierarchy">
        <div className="alert alert-danger">
          You do not have permission to access this page. Only Director SSC can manage society hierarchy.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-hierarchy creative">
      <div className="hierarchy-header">
        <h1>🏛️ Society Hierarchy Manager</h1>
        <p className="subtitle">Creative Dashboard for Managing UOG Society Leadership</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading && !showAddRoleModal ? (
        <div className="loading-creative">
          <div className="spinner"></div>
          <p>Loading societies...</p>
        </div>
      ) : societies.length === 0 ? (
        <div className="no-data-creative">
          <h3>🏫 No societies found</h3>
          <p>Start by adding some societies to manage their hierarchies</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {societies.map((society, index) => {
            const president = getPresident(society);
            const coreLeaders = getCoreLeaders(society);
            const otherRoles = getOtherRoles(society);
            const isExpanded = expandedCards.has(society.id);
            const societyColor = getSocietyColor(index);

            return (
              <div key={society.id} className="society-card-creative">
                {/* Colored Top Border */}
                <div 
                  className="card-top-border" 
                  style={{ backgroundColor: societyColor }}
                ></div>

                {/* Header */}
                <div className="card-header">
                  <h3 className="society-name">{society.name}</h3>
                  {society.coordinator_name && (
                    <div className="coordinator-badge">
                      <span className="badge-icon">👨‍🏫</span>
                      <span className="badge-text">
                        {society.coordinator_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* President Hero Section */}
                <div className="president-hero">
                  <div className="president-crown">
                    <span className="crown-icon">👑</span>
                    <h4>PRESIDENT</h4>
                  </div>
                  
                  {president ? (
                    <div className="president-info">
                      <div className="floating-input-group">
                        <input
                          type="text"
                          className="floating-input"
                          value={editingRoles[`${society.id}-${president.id}-name`] || president.name}
                          onChange={(e) => handleRoleEdit(society.id, president.id, 'name', e.target.value)}
                          placeholder=" "
                        />
                        <label className="floating-label">Full Name</label>
                      </div>
                      
                      <div className="floating-input-group">
                        <input
                          type="text"
                          className="floating-input"
                          value={editingRoles[`${society.id}-${president.id}-roll`] || president.roll_number}
                          onChange={(e) => handleRoleEdit(society.id, president.id, 'roll', e.target.value)}
                          placeholder=" "
                        />
                        <label className="floating-label">Roll Number</label>
                      </div>

                      <div className="president-actions">
                        <button
                          className="btn-save-mini"
                          onClick={() => saveRoleEdit(society.id, president.id, 'PRESIDENT')}
                          disabled={loading}
                        >
                          💾 Save
                        </button>
                        <button
                          className="btn-remove-mini"
                          onClick={() => handleRemoveRole(society.id, president.id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="no-president">
                      <p>No President assigned</p>
                      <button
                        className="btn-add-president"
                        onClick={() => openAddRoleModal(society.id)}
                      >
                        + Add President
                      </button>
                    </div>
                  )}
                </div>

                {/* Toggle Button */}
                <div className="toggle-section">
                  <button
                    className="toggle-cabinet-btn"
                    onClick={() => toggleCardExpansion(society.id)}
                  >
                    {isExpanded ? '🔼 Hide Full Cabinet' : '👇 View Full Cabinet (VP, GS)'}
                  </button>
                </div>

                {/* Expanded Cabinet Section */}
                {isExpanded && (
                  <div className="cabinet-section">
                    {/* Core Leaders */}
                    {coreLeaders.length > 0 && (
                      <div className="core-leaders">
                        <h5>🎯 Core Leadership</h5>
                        {coreLeaders.map((role) => (
                          <div key={role.id} className="role-item">
                            <div className="role-header">
                              <span className="role-badge">{role.role_name}</span>
                            </div>
                            
                            <div className="role-inputs">
                              <div className="floating-input-group small">
                                <input
                                  type="text"
                                  className="floating-input"
                                  value={editingRoles[`${society.id}-${role.id}-name`] || role.name}
                                  onChange={(e) => handleRoleEdit(society.id, role.id, 'name', e.target.value)}
                                  placeholder=" "
                                />
                                <label className="floating-label">Name</label>
                              </div>
                              
                              <div className="floating-input-group small">
                                <input
                                  type="text"
                                  className="floating-input"
                                  value={editingRoles[`${society.id}-${role.id}-roll`] || role.roll_number}
                                  onChange={(e) => handleRoleEdit(society.id, role.id, 'roll', e.target.value)}
                                  placeholder=" "
                                />
                                <label className="floating-label">Roll No</label>
                              </div>

                              <div className="role-actions">
                                <button
                                  className="btn-save-mini"
                                  onClick={() => saveRoleEdit(society.id, role.id, role.role_name)}
                                  disabled={loading}
                                >
                                  💾
                                </button>
                                <button
                                  className="btn-remove-mini"
                                  onClick={() => handleRemoveRole(society.id, role.id)}
                                  disabled={loading}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Other Roles */}
                    {otherRoles.length > 0 && (
                      <div className="other-roles">
                        <h5>📋 Other Positions</h5>
                        {otherRoles.map((role) => (
                          <div key={role.id} className="role-item other">
                            <div className="role-header">
                              <span className="role-badge secondary">{role.role_name}</span>
                            </div>
                            
                            <div className="role-inputs">
                              <div className="floating-input-group small">
                                <input
                                  type="text"
                                  className="floating-input"
                                  value={editingRoles[`${society.id}-${role.id}-name`] || role.name}
                                  onChange={(e) => handleRoleEdit(society.id, role.id, 'name', e.target.value)}
                                  placeholder=" "
                                />
                                <label className="floating-label">Name</label>
                              </div>
                              
                              <div className="floating-input-group small">
                                <input
                                  type="text"
                                  className="floating-input"
                                  value={editingRoles[`${society.id}-${role.id}-roll`] || role.roll_number}
                                  onChange={(e) => handleRoleEdit(society.id, role.id, 'roll', e.target.value)}
                                  placeholder=" "
                                />
                                <label className="floating-label">Roll No</label>
                              </div>

                              <div className="role-actions">
                                <button
                                  className="btn-save-mini"
                                  onClick={() => saveRoleEdit(society.id, role.id, role.role_name)}
                                  disabled={loading}
                                >
                                  💾
                                </button>
                                <button
                                  className="btn-remove-mini"
                                  onClick={() => handleRemoveRole(society.id, role.id)}
                                  disabled={loading}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Custom Role Button */}
                    <div className="add-role-section">
                      <button
                        className="btn-add-role-dashed"
                        onClick={() => openAddRoleModal(society.id)}
                      >
                        <span className="plus-icon">+</span>
                        <span>Add Custom Role</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="modal-overlay">
          <div className="modal creative-modal">
            <div className="modal-header">
              <h3>✨ Add New Role</h3>
              <button className="close-btn" onClick={closeAddRoleModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="floating-input-group">
                <input
                  type="text"
                  className="floating-input"
                  name="studentName"
                  value={newRole.studentName}
                  onChange={handleNewRoleChange}
                  placeholder=" "
                  required
                />
                <label className="floating-label">Student Name *</label>
              </div>

              <div className="floating-input-group">
                <input
                  type="text"
                  className="floating-input"
                  name="rollNumber"
                  value={newRole.rollNumber}
                  onChange={handleNewRoleChange}
                  placeholder=" "
                  required
                />
                <label className="floating-label">Roll Number *</label>
                <small className="help-text">
                  Auto-creates account: {newRole.rollNumber}@uog.edu.pk
                </small>
              </div>

              <div className="floating-input-group">
                <input
                  type="text"
                  className="floating-input"
                  name="roleName"
                  value={newRole.roleName}
                  onChange={handleNewRoleChange}
                  placeholder=" "
                  required
                />
                <label className="floating-label">Role Name *</label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label creative">
                  <input
                    type="checkbox"
                    name="isCoreLeader"
                    checked={newRole.isCoreLeader}
                    onChange={handleNewRoleChange}
                  />
                  <span className="checkmark">✓</span>
                  <span className="checkbox-text">Core Leader (Dashboard Access)</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeAddRoleModal}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary creative"
                onClick={() => handleAddRole(editingSocietyId)}
                disabled={loading || !newRole.studentName || !newRole.rollNumber || !newRole.roleName}
              >
                {loading ? '✨ Adding...' : '✨ Add Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHierarchy;