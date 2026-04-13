import React, { useState } from 'react';
import './FeedbackModal.css';

/**
 * MODULE 3: FEEDBACK & ISSUE REPORTING - User Facing Modal
 * 
 * Allows users to submit feedback and report issues
 * Tickets go directly to System Admin Control Centre
 */

const FeedbackModal = ({ isOpen, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subjectOptions = [
    'Bug Report',
    'Feature Request',
    'Performance Issue',
    'UI/UX Problem',
    'Data Error',
    'Access Issue',
    'General Feedback',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!subject || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem('campus_connect_token');
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject,
          message: message.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit ticket');
      }

      const data = await response.json();

      // Show success message
      alert('✅ ' + (data.message || 'Issue sent to IT Support'));

      // Reset form
      setSubject('');
      setMessage('');
      
      // Close modal
      onClose();

    } catch (err) {
      console.error('Submit ticket error:', err);
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setSubject('');
      setMessage('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay" onClick={handleClose}>
      <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal-header">
          <h2>📝 Report an Issue / Feedback</h2>
          <button 
            onClick={handleClose}
            className="feedback-modal-close"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-modal-body">
          {error && (
            <div className="feedback-error-alert">
              ⚠️ {error}
            </div>
          )}

          <div className="feedback-form-group">
            <label htmlFor="subject">Subject *</label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              disabled={submitting}
              className="feedback-select"
            >
              <option value="">-- Select a subject --</option>
              {subjectOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="feedback-form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue or provide your feedback..."
              required
              disabled={submitting}
              className="feedback-textarea"
              rows="6"
            />
            <small className="feedback-char-count">
              {message.length} characters
            </small>
          </div>

          <div className="feedback-info-box">
            <p>
              <strong>ℹ️ Note:</strong> Your feedback will be sent directly to IT Support. 
              We'll review your submission and take appropriate action.
            </p>
          </div>

          <div className="feedback-modal-footer">
            <button 
              type="button"
              onClick={handleClose}
              className="feedback-btn feedback-btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="feedback-btn feedback-btn-primary"
              disabled={submitting || !subject || !message.trim()}
            >
              {submitting ? 'Submitting...' : '📤 Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
