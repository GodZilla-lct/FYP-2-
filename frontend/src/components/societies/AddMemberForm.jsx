/**
 * Add Member Form Component
 * Form for adding new cabinet members to the historical ledger
 * 
 * IMPORTANT: Cabinet members do NOT receive portal access.
 * This form only creates text records.
 */

import { useState } from 'react';
import { addCabinetMember, getCurrentAcademicYear, validateAcademicYear } from '../../services/cabinetService';

const AddMemberForm = ({ societyId, onMemberAdded }) => {
  const [formData, setFormData] = useState({
    student_name: '',
    roll_number: '',
    custom_role_title: '',
    academic_year: getCurrentAcademicYear()
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages on input
    if (error) setError('');
    if (success) setSuccess('');
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    if (!formData.student_name.trim()) {
      setError('Student name is required');
      return false;
    }
    
    if (formData.student_name.length > 100) {
      setError('Student name must be 100 characters or less');
      return false;
    }
    
    if (!formData.roll_number.trim()) {
      setError('Roll number is required');
      return false;
    }
    
    if (formData.roll_number.length > 50) {
      setError('Roll number must be 50 characters or less');
      return false;
    }
    
    if (!formData.custom_role_title.trim()) {
      setError('Role title is required');
      return false;
    }
    
    if (formData.custom_role_title.length > 100) {
      setError('Role title must be 100 characters or less');
      return false;
    }
    
    if (!formData.academic_year.trim()) {
      setError('Academic year is required');
      return false;
    }
    
    if (!validateAcademicYear(formData.academic_year)) {
      setError('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)');
      return false;
    }
    
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      
      const memberData = {
        society_id: societyId,
        ...formData
      };
      
      const response = await addCabinetMember(memberData);
      
      if (response.success) {
        setSuccess(`${formData.student_name} added to cabinet roster successfully!`);
        
        // Reset form
        setFormData({
          student_name: '',
          roll_number: '',
          custom_role_title: '',
          academic_year: getCurrentAcademicYear()
        });
        
        // Notify parent to refresh list
        if (onMemberAdded) {
          onMemberAdded();
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to add cabinet member');
      console.error('Add member error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Reset form
   */
  const handleReset = () => {
    setFormData({
      student_name: '',
      roll_number: '',
      custom_role_title: '',
      academic_year: getCurrentAcademicYear()
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="add-member-form-container">
      <div className="form-header">
        <h3 className="form-title">➕ Add New Cabinet Member</h3>
        <p className="form-description">
          Add a student to the historical cabinet roster
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-member-form">
        <div className="form-grid">
          {/* Student Name */}
          <div className="form-group">
            <label htmlFor="student_name" className="form-label">
              Student Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="student_name"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              placeholder="e.g., Ahmed Hassan"
              maxLength={100}
              required
              disabled={submitting}
              className="form-input"
            />
          </div>

          {/* Roll Number */}
          <div className="form-group">
            <label htmlFor="roll_number" className="form-label">
              Roll Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="roll_number"
              name="roll_number"
              value={formData.roll_number}
              onChange={handleChange}
              placeholder="e.g., 2021-CS-123"
              maxLength={50}
              required
              disabled={submitting}
              className="form-input"
            />
          </div>

          {/* Custom Role Title */}
          <div className="form-group">
            <label htmlFor="custom_role_title" className="form-label">
              Role Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="custom_role_title"
              name="custom_role_title"
              value={formData.custom_role_title}
              onChange={handleChange}
              placeholder="e.g., Graphics Head, Event Manager"
              maxLength={100}
              required
              disabled={submitting}
              className="form-input"
            />
          </div>

          {/* Academic Year */}
          <div className="form-group">
            <label htmlFor="academic_year" className="form-label">
              Academic Year <span className="required">*</span>
            </label>
            <input
              type="text"
              id="academic_year"
              name="academic_year"
              value={formData.academic_year}
              onChange={handleChange}
              placeholder="YYYY-YYYY (e.g., 2023-2024)"
              pattern="\d{4}-\d{4}"
              maxLength={9}
              required
              disabled={submitting}
              className="form-input"
            />
            <small className="form-hint">Format: YYYY-YYYY</small>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <span>💾</span>
                Save to Roster
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="btn btn-secondary"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMemberForm;
