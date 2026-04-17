/**
 * Cabinet Management Component
 * Manages society cabinet members (historical records only)
 * 
 * IMPORTANT: Cabinet members listed here do NOT receive portal access.
 * This is a text-only historical ledger of society leadership.
 */

import { useState, useEffect } from 'react';
import './CabinetManagement.css';
import {
  addCabinetMember,
  getCabinetMembers,
  updateCabinetMember,
  deleteCabinetMember,
  getUniqueAcademicYears,
  validateAcademicYear,
  getCurrentAcademicYear
} from '../../services/cabinetService';

const CabinetManagement = ({ societyId, societyName, userRole, isLeader }) => {
  // State for cabinet members list
  const [cabinetMembers, setCabinetMembers] = useState([]);
  
  // State for form data (adding new member)
  const [formData, setFormData] = useState({
    student_name: '',
    roll_number: '',
    custom_role_title: '',
    academic_year: getCurrentAcademicYear()
  });
  
  // State for editing
  const [editingMember, setEditingMember] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Fetch cabinet members on mount and when filters change
  useEffect(() => {
    fetchMembers();
  }, [societyId, selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps
  
  /**
   * Fetch cabinet members from API
   */
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getCabinetMembers(societyId, selectedYear);
      
      if (response.success) {
        setCabinetMembers(response.data.members || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load cabinet members');
      console.error('Fetch members error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * Handle edit form input changes
   */
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * Validate form data
   */
  const validateForm = (data) => {
    if (!data.student_name || data.student_name.trim().length === 0) {
      return 'Student name is required';
    }
    if (data.student_name.length > 100) {
      return 'Student name must not exceed 100 characters';
    }
    
    if (!data.roll_number || data.roll_number.trim().length === 0) {
      return 'Roll number is required';
    }
    if (data.roll_number.length > 50) {
      return 'Roll number must not exceed 50 characters';
    }
    
    if (!data.custom_role_title || data.custom_role_title.trim().length === 0) {
      return 'Role title is required';
    }
    if (data.custom_role_title.length > 100) {
      return 'Role title must not exceed 100 characters';
    }
    
    if (!data.academic_year || data.academic_year.trim().length === 0) {
      return 'Academic year is required';
    }
    if (!validateAcademicYear(data.academic_year)) {
      return 'Academic year must be in format YYYY-YYYY (e.g., "2023-2024")';
    }
    
    return null;
  };
  
  /**
   * Handle add member form submission
   */
  const handleAddMember = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await addCabinetMember({
        society_id: societyId,
        ...formData
      });
      
      if (response.success) {
        setSuccess('Cabinet member added successfully!');
        
        // Reset form
        setFormData({
          student_name: '',
          roll_number: '',
          custom_role_title: '',
          academic_year: getCurrentAcademicYear()
        });
        
        // Close form
        setShowAddForm(false);
        
        // Refresh list
        await fetchMembers();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to add cabinet member');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handle edit member
   */
  const handleEditMember = (member) => {
    setEditingMember(member.id);
    setEditFormData({
      student_name: member.student_name,
      roll_number: member.roll_number,
      custom_role_title: member.custom_role_title,
      academic_year: member.academic_year
    });
    setError('');
    setSuccess('');
  };
  
  /**
   * Handle update member form submission
   */
  const handleUpdateMember = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm(editFormData);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await updateCabinetMember(editingMember, editFormData);
      
      if (response.success) {
        setSuccess('Cabinet member updated successfully!');
        setEditingMember(null);
        setEditFormData({});
        
        // Refresh list
        await fetchMembers();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update cabinet member');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handle delete member
   */
  const handleDeleteMember = async (memberId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await deleteCabinetMember(memberId);
      
      if (response.success) {
        setSuccess('Cabinet member deleted successfully!');
        setDeleteConfirm(null);
        
        // Refresh list
        await fetchMembers();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete cabinet member');
      setDeleteConfirm(null);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Cancel edit
   */
  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditFormData({});
    setError('');
  };
  
  /**
   * Filter members by search query
   */
  const filteredMembers = cabinetMembers.filter(member => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      member.student_name.toLowerCase().includes(query) ||
      member.roll_number.toLowerCase().includes(query) ||
      member.custom_role_title.toLowerCase().includes(query)
    );
  });
  
  /**
   * Get unique academic years for filter
   */
  const academicYears = getUniqueAcademicYears(cabinetMembers);
  
  /**
   * Check if user can manage cabinet
   */
  const canManage = isLeader || userRole === 'DIRECTOR_SSC' || userRole === 'COORDINATOR';
  
  return (
    <div className="cabinet-management">
      <div className="cabinet-header">
        <div className="header-content">
          <h2>📋 Cabinet Management</h2>
          <p className="subtitle">
            Historical ledger of {societyName} leadership
          </p>
          <p className="info-text">
            ℹ️ <strong>Note:</strong> Cabinet members listed here do NOT receive portal access or login credentials.
          </p>
        </div>
        
        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading}
          >
            {showAddForm ? '✕ Cancel' : '+ Add Member'}
          </button>
        )}
      </div>
      
      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          ✓ {success}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          ✗ {error}
        </div>
      )}
      
      {/* Add Member Form */}
      {showAddForm && canManage && (
        <div className="cabinet-form-card">
          <h3>Add New Cabinet Member</h3>
          <form onSubmit={handleAddMember}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="student_name">
                  Student Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="student_name"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Ahmed Hassan"
                  maxLength={100}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="roll_number">
                  Roll Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="roll_number"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleInputChange}
                  placeholder="e.g., 2021-CS-123"
                  maxLength={50}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="custom_role_title">
                  Role Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="custom_role_title"
                  name="custom_role_title"
                  value={formData.custom_role_title}
                  onChange={handleInputChange}
                  placeholder="e.g., Graphics Head, Event Manager"
                  maxLength={100}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="academic_year">
                  Academic Year <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="academic_year"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  placeholder="e.g., 2023-2024"
                  pattern="\d{4}-\d{4}"
                  title="Format: YYYY-YYYY (e.g., 2023-2024)"
                  maxLength={20}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filters */}
      <div className="cabinet-filters">
        <div className="filter-group">
          <label htmlFor="search">🔍 Search:</label>
          <input
            type="text"
            id="search"
            placeholder="Search by name, roll number, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="year-filter">📅 Academic Year:</label>
          <select
            id="year-filter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={loading}
          >
            <option value="">All Years</option>
            {academicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-info">
          Showing {filteredMembers.length} of {cabinetMembers.length} members
        </div>
      </div>
      
      {/* Cabinet Members List */}
      {loading && !showAddForm && !editingMember ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading cabinet members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="empty-state">
          <p>📭 No cabinet members found</p>
          {canManage && !showAddForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              + Add First Member
            </button>
          )}
        </div>
      ) : (
        <div className="cabinet-table-container">
          <table className="cabinet-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Role Title</th>
                <th>Academic Year</th>
                <th>Added By</th>
                <th>Date Added</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => (
                <tr key={member.id}>
                  {editingMember === member.id ? (
                    // Edit Mode
                    <>
                      <td>
                        <input
                          type="text"
                          name="student_name"
                          value={editFormData.student_name}
                          onChange={handleEditInputChange}
                          maxLength={100}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="roll_number"
                          value={editFormData.roll_number}
                          onChange={handleEditInputChange}
                          maxLength={50}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="custom_role_title"
                          value={editFormData.custom_role_title}
                          onChange={handleEditInputChange}
                          maxLength={100}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="academic_year"
                          value={editFormData.academic_year}
                          onChange={handleEditInputChange}
                          pattern="\d{4}-\d{4}"
                          maxLength={20}
                          required
                        />
                      </td>
                      <td colSpan="2">
                        <div className="edit-actions">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={handleUpdateMember}
                            disabled={loading}
                          >
                            ✓ Save
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={handleCancelEdit}
                            disabled={loading}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </td>
                      <td></td>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <td>{member.student_name}</td>
                      <td>{member.roll_number}</td>
                      <td>
                        <span className="role-badge">{member.custom_role_title}</span>
                      </td>
                      <td>{member.academic_year}</td>
                      <td>
                        <div className="added-by-info">
                          <span>{member.added_by_name}</span>
                          <small>{member.added_by_email}</small>
                        </div>
                      </td>
                      <td>
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-edit"
                              onClick={() => handleEditMember(member)}
                              disabled={loading || editingMember !== null}
                              title="Edit member"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => setDeleteConfirm(member.id)}
                              disabled={loading || editingMember !== null}
                              title="Delete member"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Confirm Deletion</h3>
            <p>
              Are you sure you want to delete this cabinet member record?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteMember(deleteConfirm)}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CabinetManagement;
