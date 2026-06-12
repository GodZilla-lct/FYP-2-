/**
 * ProposalDetails.jsx - Proposal Review Component with 3-Button Action Group
 * 
 * Features:
 * - Approve (Green) - Progresses workflow
 * - Reject (Red) - Hard rejection
 * - Return for Revision (Orange) - With dropdown for specific reasons
 */

import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import './ProposalDetails.css';

const ProposalDetails = ({ proposalId, user, onClose, onActionComplete }) => {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRevisionDropdown, setShowRevisionDropdown] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const revisionOptions = [
    { value: 'CHANGE_EVENT_DATE', label: 'Change Event Date' },
    { value: 'ADJUST_BUDGET', label: 'Adjust Budget' },
    { value: 'INCOMPLETE_DETAILS', label: 'Incomplete Details' }
  ];

  useEffect(() => {
    fetchProposal();
  }, [proposalId]);

  useEffect(() => {
    if (!proposalId) return;
    const loadComments = async () => {
      setCommentsLoading(true);
      try {
        const res = await apiFetch(`/proposals/${proposalId}/comments`);
        const data = await res.json();
        if (data.success && Array.isArray(data.comments)) {
          setComments(data.comments);
        }
      } catch (e) {
        console.error('Failed to load comments', e);
      } finally {
        setCommentsLoading(false);
      }
    };
    loadComments();
  }, [proposalId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !proposal) return;
    setCommentBusy(true);
    try {
      const res = await apiFetch(`/proposals/${proposal.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: newComment.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewComment('');
        const list = await apiFetch(`/proposals/${proposal.id}/comments`);
        const listData = await list.json();
        if (listData.success) setComments(listData.comments || []);
      } else {
        alert(data.error || 'Could not add comment');
      }
    } catch (err) {
      alert(err.message || 'Could not add comment');
    } finally {
      setCommentBusy(false);
    }
  };

  const handleSaveEdit = async (commentId) => {
    if (!proposal || !editingText.trim()) return;
    setCommentBusy(true);
    try {
      const res = await apiFetch(`/proposals/${proposal.id}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ comment: editingText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingId(null);
        setEditingText('');
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, comment: editingText.trim() } : c
          )
        );
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      alert(err.message || 'Update failed');
    } finally {
      setCommentBusy(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!proposal || !window.confirm('Delete this comment?')) return;
    setCommentBusy(true);
    try {
      const res = await apiFetch(`/proposals/${proposal.id}/comments/${commentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert(data.error || 'Delete failed');
      }
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setCommentBusy(false);
    }
  };

  const fetchProposal = async () => {
    try {
      setLoading(true);
      console.log('[ProposalDetails] Fetching proposal ID:', proposalId);
      const response = await apiFetch(`/proposals/${proposalId}`);
      const data = await response.json();
      console.log('[ProposalDetails] API response:', data);
      
      if (data && data.proposal) {
        setProposal(data.proposal);
      } else {
        console.error('[ProposalDetails] Proposal not found in response:', data);
      }
    } catch (err) {
      console.error('[ProposalDetails] Error fetching proposal:', err);
    } finally {
      setLoading(false);
    }
  };

  const canProcessProposal = () => {
    if (!proposal) return false;
    
    const roleStatusMap = {
      'COORDINATOR': ['PENDING_COORDINATOR'],
      'DIRECTOR_SSC': ['PENDING_DIRECTOR_SSC'],
      'ASST_DIRECTOR': ['PENDING_ASST_DIRECTOR'],
      'FINANCE_SECRETARY': ['PENDING_FINANCE_SECRETARY'],
      'REGISTRAR': ['PENDING_REGISTRAR']
    };

    return roleStatusMap[user.role]?.includes(proposal.current_status) || false;
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this proposal?')) {
      return;
    }

    await processProposal('APPROVE', null);
  };

  const handleReject = async () => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    if (!window.confirm('This is a HARD rejection. The proposal cannot be resubmitted. Continue?')) {
      return;
    }

    await processProposal('REJECT', reason);
  };

  const handleReturnForRevision = async () => {
    if (!revisionReason) {
      alert('Please select a revision reason');
      return;
    }

    const reasonText = revisionOptions.find(opt => opt.value === revisionReason)?.label || revisionReason;
    const finalReason = customReason.trim() 
      ? `${reasonText}: ${customReason}` 
      : reasonText;

    // Use 'REJECT' action with 'SOFT' rejection type for returning for revision
    await processProposal('REJECT', finalReason, 'SOFT');
  };

  const processProposal = async (action, reason, rejectionType = null) => {
    try {
      setProcessing(true);

      const requestBody = {
        proposalId: proposal.id,
        action,
        rejectionReason: reason,
        rejectionType: rejectionType || (action === 'REJECT' ? 'HARD' : 'SOFT')
      };

      const response = await apiFetch('/proposals/next-status', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        alert(`Proposal ${action.toLowerCase().replace('_', ' ')} successfully!`);
        setShowRevisionDropdown(false);
        setRevisionReason('');
        setCustomReason('');
        
        if (onActionComplete) {
          onActionComplete();
        }
        
        if (onClose) {
          onClose();
        }
      } else {
        alert(data.message || 'Failed to process proposal');
      }
    } catch (err) {
      console.error('Error processing proposal:', err);
      alert('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#28a745';
      case 'REJECTED': return '#dc3545';
      case 'RETURNED_FOR_REVISION': return '#ffc107';
      default: return '#17a2b8';
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

  if (loading) {
    return (
      <div className="proposal-details-modal">
        <div className="modal-content">
          <div className="loading">Loading proposal...</div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="proposal-details-modal">
        <div className="modal-content">
          <div className="error">Proposal not found</div>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="proposal-details-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{proposal.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Proposal Information */}
          <div className="proposal-info-grid">
            <div className="info-item">
              <label>Society:</label>
              <span>{proposal.society_name}</span>
            </div>
            <div className="info-item">
              <label>Event Date:</label>
              <span>{new Date(proposal.event_date).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Budget Requested:</label>
              <span className="budget">PKR {proposal.budget_requested.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <label>Current Status:</label>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(proposal.current_status) }}
              >
                {getStatusLabel(proposal.current_status)}
              </span>
            </div>
            <div className="info-item">
              <label>Created By:</label>
              <span>{proposal.created_by_name} ({proposal.created_by_roll})</span>
            </div>
            <div className="info-item">
              <label>Created On:</label>
              <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Description */}
          <div className="proposal-description">
            <h3>Description</h3>
            <p>{proposal.description}</p>
          </div>

          {/* Attachments */}
          {proposal.attachments && proposal.attachments.length > 0 && (
            <div className="proposal-attachments">
              <h3>Attachments</h3>
              <ul>
                {proposal.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                      📎 {attachment.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Approval History */}
          {proposal.approval_history && proposal.approval_history.length > 0 && (
            <div className="approval-history">
              <h3>Approval History</h3>
              <div className="history-timeline">
                {proposal.approval_history.map((history, index) => (
                  <div key={index} className="history-item">
                    <div className="history-icon">
                      {history.action === 'APPROVE' ? '✅' : '❌'}
                    </div>
                    <div className="history-content">
                      <p className="history-action">{history.action}</p>
                      <p className="history-approver">{history.approver_name} ({history.approver_role})</p>
                      <p className="history-date">{new Date(history.created_at).toLocaleString()}</p>
                      {history.comments && <p className="history-comments">{history.comments}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="proposal-comments-section">
            <h3>Discussion</h3>
            <p className="comments-hint">Comments are visible to everyone who can open this proposal.</p>
            {commentsLoading ? (
              <p className="loading">Loading comments…</p>
            ) : (
              <ul className="proposal-comments-list">
                {comments.length === 0 ? (
                  <li className="no-comments">No comments yet.</li>
                ) : (
                  comments.map((c) => (
                    <li key={c.id} className="proposal-comment-item">
                      <div className="comment-meta">
                        <strong>{c.user_name}</strong>
                        <span className="comment-role">({c.user_role})</span>
                        <span className="comment-date">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      {editingId === c.id ? (
                        <div className="comment-edit">
                          <textarea
                            rows={3}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                          />
                          <div className="comment-edit-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingId(null);
                                setEditingText('');
                              }}
                              disabled={commentBusy}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSaveEdit(c.id)}
                              disabled={commentBusy}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="comment-body">{c.comment}</p>
                          {(Number(c.user_id) === Number(user.id) || user.role === 'DIRECTOR_SSC') && (
                            <div className="comment-actions">
                              {Number(c.user_id) === Number(user.id) && (
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm"
                                  onClick={() => {
                                    setEditingId(c.id);
                                    setEditingText(c.comment);
                                  }}
                                  disabled={commentBusy}
                                >
                                  Edit
                                </button>
                              )}
                              {(Number(c.user_id) === Number(user.id) || user.role === 'DIRECTOR_SSC') && (
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm text-danger"
                                  onClick={() => handleDeleteComment(c.id)}
                                  disabled={commentBusy}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
            <form className="proposal-comment-form" onSubmit={handleAddComment}>
              <label htmlFor="new-proposal-comment">Add a comment</label>
              <textarea
                id="new-proposal-comment"
                rows={3}
                maxLength={2000}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ask a question or leave a note for approvers…"
              />
              <button type="submit" className="btn btn-primary" disabled={commentBusy || !newComment.trim()}>
                {commentBusy ? 'Posting…' : 'Post comment'}
              </button>
            </form>
          </div>
        </div>
        <div className="modal-footer">
          {canProcessProposal() ? (
            <div className="action-buttons-container">
              {/* Approve Button (Green) */}
              <button
                className="btn btn-approve"
                onClick={handleApprove}
                disabled={processing}
              >
                ✅ Approve
              </button>

              {/* Reject Button (Red) */}
              <button
                className="btn btn-reject"
                onClick={handleReject}
                disabled={processing}
              >
                ❌ Reject
              </button>

              {/* Return for Revision Button (Orange) */}
              <div className="revision-button-wrapper">
                <button
                  className="btn btn-revision"
                  onClick={() => setShowRevisionDropdown(!showRevisionDropdown)}
                  disabled={processing}
                >
                  🔄 Return for Revision
                </button>

                {/* Revision Dropdown */}
                {showRevisionDropdown && (
                  <div className="revision-dropdown">
                    <h4>Select Revision Reason:</h4>
                    <div className="revision-options">
                      {revisionOptions.map(option => (
                        <label key={option.value} className="revision-option">
                          <input
                            type="radio"
                            name="revisionReason"
                            value={option.value}
                            checked={revisionReason === option.value}
                            onChange={(e) => setRevisionReason(e.target.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      placeholder="Additional comments (optional)"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      rows="3"
                    />
                    <div className="revision-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowRevisionDropdown(false);
                          setRevisionReason('');
                          setCustomReason('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleReturnForRevision}
                        disabled={!revisionReason || processing}
                      >
                        Submit Revision Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-action-message">
              <p>You cannot process this proposal at its current status.</p>
              <button onClick={onClose} className="btn btn-secondary">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;
