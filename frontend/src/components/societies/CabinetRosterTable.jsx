/**
 * Cabinet Roster Table Component
 * Displays the list of cabinet members with remove functionality
 * 
 * IMPORTANT: Cabinet members do NOT receive portal access.
 * This table displays historical records only.
 */

import { useState } from 'react';
import { deleteCabinetMember } from '../../services/cabinetService';

const CabinetRosterTable = ({ cabinetMembers, loading, canManage, onMemberDeleted }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState('');

  /**
   * Handle delete confirmation
   */
  const handleDeleteClick = (memberId) => {
    setConfirmDeleteId(memberId);
    setError('');
  };

  /**
   * Cancel delete operation
   */
  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  /**
   * Confirm and execute delete
   */
  const handleConfirmDelete = async (member) => {
    try {
      setDeletingId(member.id);
      setError('');
      
      const response = await deleteCabinetMember(member.id);
      
      if (response.success) {
        // Notify parent to refresh list
        if (onMemberDeleted) {
          onMemberDeleted();
        }
        setConfirmDeleteId(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete cabinet member');
      console.error('Delete member error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="roster-table-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading cabinet members...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (cabinetMembers.length === 0) {
    return (
      <div className="roster-table-container">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Cabinet Members Found</h3>
          <p>
            {canManage 
              ? 'Add your first cabinet member using the form above.'
              : 'No cabinet members have been added yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="roster-table-container">
      <div className="table-header">
        <h3 className="table-title">Cabinet Members</h3>
        <span className="table-count">{cabinetMembers.length} total</span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Responsive Table */}
      <div className="table-wrapper">
        <table className="roster-table">
          <thead>
            <tr>
              <th className="th-name">Student Name</th>
              <th className="th-roll">Roll Number</th>
              <th className="th-role">Role Title</th>
              <th className="th-year">Academic Year</th>
              <th className="th-date">Added On</th>
              {canManage && <th className="th-actions">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {cabinetMembers.map((member) => (
              <tr key={member.id} className="table-row">
                <td className="td-name" data-label="Student Name">
                  <div className="member-name">
                    <span className="name-icon">👤</span>
                    <span className="name-text">{member.student_name}</span>
                  </div>
                </td>
                <td className="td-roll" data-label="Roll Number">
                  <span className="roll-badge">{member.roll_number}</span>
                </td>
                <td className="td-role" data-label="Role Title">
                  <span className="role-badge">{member.custom_role_title}</span>
                </td>
                <td className="td-year" data-label="Academic Year">
                  <span className="year-badge">{member.academic_year}</span>
                </td>
                <td className="td-date" data-label="Added On">
                  {formatDate(member.created_at)}
                </td>
                {canManage && (
                  <td className="td-actions" data-label="Actions">
                    {confirmDeleteId === member.id ? (
                      <div className="confirm-delete">
                        <button
                          onClick={() => handleConfirmDelete(member)}
                          disabled={deletingId === member.id}
                          className="btn-confirm-delete"
                          title="Confirm Delete"
                        >
                          {deletingId === member.id ? (
                            <span className="spinner-small"></span>
                          ) : (
                            '✓'
                          )}
                        </button>
                        <button
                          onClick={handleCancelDelete}
                          disabled={deletingId === member.id}
                          className="btn-cancel-delete"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(member.id)}
                        disabled={deletingId !== null}
                        className="btn-delete"
                        title="Remove Member"
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View (hidden on desktop) */}
      <div className="mobile-cards">
        {cabinetMembers.map((member) => (
          <div key={member.id} className="member-card">
            <div className="card-header">
              <div className="member-name">
                <span className="name-icon">👤</span>
                <span className="name-text">{member.student_name}</span>
              </div>
              {canManage && (
                <div className="card-actions">
                  {confirmDeleteId === member.id ? (
                    <div className="confirm-delete">
                      <button
                        onClick={() => handleConfirmDelete(member)}
                        disabled={deletingId === member.id}
                        className="btn-confirm-delete"
                        title="Confirm Delete"
                      >
                        {deletingId === member.id ? (
                          <span className="spinner-small"></span>
                        ) : (
                          '✓'
                        )}
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        disabled={deletingId === member.id}
                        className="btn-cancel-delete"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDeleteClick(member.id)}
                      disabled={deletingId !== null}
                      className="btn-delete-mobile"
                      title="Remove Member"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="card-body">
              <div className="card-field">
                <span className="field-label">Roll Number:</span>
                <span className="roll-badge">{member.roll_number}</span>
              </div>
              <div className="card-field">
                <span className="field-label">Role:</span>
                <span className="role-badge">{member.custom_role_title}</span>
              </div>
              <div className="card-field">
                <span className="field-label">Academic Year:</span>
                <span className="year-badge">{member.academic_year}</span>
              </div>
              <div className="card-field">
                <span className="field-label">Added On:</span>
                <span className="field-value">{formatDate(member.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CabinetRosterTable;
