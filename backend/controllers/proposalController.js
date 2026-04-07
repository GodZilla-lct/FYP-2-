const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/proposals';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `proposal-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

/**
 * Determines the next status based on current status and coordinator existence
 * Implements the conditional approval workflow with Null Coordinator Check
 */
async function getNextStatus(currentStatus, hasCoordinator, isRejection = false) {
  if (isRejection) {
    return 'RETURNED_FOR_REVISION';
  }

  switch (currentStatus) {
    case 'PENDING_COORDINATOR':
      return 'PENDING_DIRECTOR_SSC';
    case 'PENDING_DIRECTOR_SSC':
      return 'PENDING_ASST_DIRECTOR';
    case 'PENDING_ASST_DIRECTOR':
      return 'PENDING_FINANCE_SECRETARY';
    case 'PENDING_FINANCE_SECRETARY':
      return 'PENDING_REGISTRAR';
    case 'PENDING_REGISTRAR':
      return 'PENDING_VC';
    case 'PENDING_VC':
      return 'APPROVED';
    case 'RETURNED_FOR_REVISION':
      return hasCoordinator ? 'PENDING_COORDINATOR' : 'PENDING_DIRECTOR_SSC';
    default:
      throw new Error(`Invalid current status: ${currentStatus}`);
  }
}

/**
 * Create a new proposal with file upload support
 * POST /proposals
 * FIXED: Handles multipart/form-data, auto-links to user's society, robust error handling
 */
async function createProposal(req, res) {
  const connection = await pool.getConnection();

  try {
    const { title, description, eventDate, budgetRequested } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !description || !eventDate || !budgetRequested) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Title, description, event date, and budget are required'
      });
    }

    // Validate date format
    const eventDateObj = new Date(eventDate);
    if (isNaN(eventDateObj.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format',
        details: 'Event date must be in YYYY-MM-DD format'
      });
    }

    // Validate budget
    const budget = parseFloat(budgetRequested);
    if (isNaN(budget) || budget <= 0) {
      return res.status(400).json({ 
        error: 'Invalid budget',
        details: 'Budget must be a positive number'
      });
    }

    // Get user's society from society_roles (core leaders only)
    const [userSocieties] = await connection.query(
      `SELECT sr.society_id, s.name as society_name, s.coordinator_id
       FROM society_roles sr
       JOIN societies s ON sr.society_id = s.id
       WHERE sr.user_id = ? AND sr.is_core_leader = TRUE
       LIMIT 1`,
      [userId]
    );

    if (userSocieties.length === 0) {
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'Only core society leaders can create proposals'
      });
    }

    const societyId = userSocieties[0].society_id;
    const hasCoordinator = userSocieties[0].coordinator_id !== null;

    // CRITICAL: Null Coordinator Check
    const initialStatus = hasCoordinator ? 'PENDING_COORDINATOR' : 'PENDING_DIRECTOR_SSC';

    // Create proposal
    const [result] = await connection.query(
      `INSERT INTO proposals (society_id, user_id, title, description, event_date, budget_requested, current_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [societyId, userId, title, description, eventDate, budget, initialStatus]
    );

    const proposalId = result.insertId;

    // Handle file uploads if present
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await connection.query(
          'INSERT INTO proposal_attachments (proposal_id, file_url, file_name) VALUES (?, ?, ?)',
          [proposalId, `/uploads/proposals/${file.filename}`, file.originalname]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Proposal created successfully',
      proposal: {
        id: proposalId,
        title,
        society_name: userSocieties[0].society_name,
        current_status: initialStatus,
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error creating proposal:', error);
    
    // Handle specific errors
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ 
        error: 'Data too long',
        details: 'One or more fields exceed maximum length'
      });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Duplicate entry',
        details: 'A proposal with similar details already exists'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      details: 'Failed to create proposal. Please try again.'
    });
  } finally {
    await connection.release();
  }
}

/**
 * Get proposals based on user role
 * GET /proposals
 * CRITICAL FIX: Admin can see ALL proposals, Society leaders see only their society's proposals
 */
async function getProposals(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`User Role: ${userRole} - Fetching proposals for user ID: ${userId}`);

    let proposals = [];

    // Check User Role: Admin roles can see ALL proposals
    const adminRoles = ['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC', 'COORDINATOR'];
    
    if (adminRoles.includes(userRole)) {
      // IF ADMIN: Query ALL proposals with JOINs for Society and User info
      const [allProposals] = await connection.query(`
        SELECT 
          p.*,
          s.name as society_name,
          u.name as created_by_name,
          u.roll_number as created_by_roll,
          president.name as president_name,
          president.roll_number as president_roll
        FROM proposals p
        JOIN societies s ON p.society_id = s.id
        JOIN users u ON p.user_id = u.id
        LEFT JOIN society_roles sr ON s.id = sr.society_id AND sr.role_name = 'PRESIDENT' AND sr.is_core_leader = TRUE
        LEFT JOIN users president ON sr.user_id = president.id
        ORDER BY p.created_at DESC
      `);
      
      proposals = allProposals;
      console.log(`User Role: ${userRole} - Proposals Found: ${proposals.length}`);
      
    } else {
      // IF SOCIETY LEADER: Query only their society's proposals
      const [userSocieties] = await connection.query(
        `SELECT sr.society_id, s.name as society_name
         FROM society_roles sr
         JOIN societies s ON sr.society_id = s.id
         WHERE sr.user_id = ? AND sr.is_core_leader = TRUE`,
        [userId]
      );

      if (userSocieties.length === 0) {
        console.log(`User Role: ${userRole} - Proposals Found: 0 (No society access)`);
        return res.json({ success: true, proposals: [], society_name: null });
      }

      const societyId = userSocieties[0].society_id;

      // Get proposals for this society only
      const [societyProposals] = await connection.query(
        `SELECT p.*, u.name as created_by_name, u.roll_number as created_by_roll
         FROM proposals p
         JOIN users u ON p.user_id = u.id
         WHERE p.society_id = ?
         ORDER BY p.created_at DESC`,
        [societyId]
      );

      proposals = societyProposals;
      console.log(`User Role: ${userRole} - Proposals Found: ${proposals.length}`);
    }

    // Get attachments for each proposal
    for (let proposal of proposals) {
      const [attachments] = await connection.query(
        'SELECT id, file_url, file_name FROM proposal_attachments WHERE proposal_id = ?',
        [proposal.id]
      );
      proposal.attachments = attachments;
    }

    res.json({
      success: true,
      proposals,
      userRole,
      isAdmin: adminRoles.includes(userRole)
    });

  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}
async function getMyProposals(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    // Get user's society
    const [userSocieties] = await connection.query(
      `SELECT sr.society_id, s.name as society_name
       FROM society_roles sr
       JOIN societies s ON sr.society_id = s.id
       WHERE sr.user_id = ? AND sr.is_core_leader = TRUE`,
      [userId]
    );

    if (userSocieties.length === 0) {
      return res.json({ success: true, proposals: [] });
    }

    const societyId = userSocieties[0].society_id;

    // Get all proposals for this society
    const [proposals] = await connection.query(
      `SELECT p.*, u.name as created_by_name, u.roll_number as created_by_roll
       FROM proposals p
       JOIN users u ON p.user_id = u.id
       WHERE p.society_id = ?
       ORDER BY p.created_at DESC`,
      [societyId]
    );

    // Get attachments for each proposal
    for (let proposal of proposals) {
      const [attachments] = await connection.query(
        'SELECT id, file_url, file_name FROM proposal_attachments WHERE proposal_id = ?',
        [proposal.id]
      );
      proposal.attachments = attachments;
    }

    res.json({
      success: true,
      proposals,
      society_name: userSocieties[0].society_name
    });

  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Handle proposal status transitions (approve/reject/resubmit)
 * POST /proposals/next-status
 * FIXED: Proper SOFT vs HARD rejection logic
 */
async function handleProposalStatusTransition(req, res) {
  const connection = await pool.getConnection();

  try {
    const { proposalId, action, rejectionReason, rejectionType, assignedAsstDirectorId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate input
    if (!proposalId || !action) {
      return res.status(400).json({ error: 'proposalId and action are required' });
    }

    if (action === 'REJECT' && !rejectionReason) {
      return res.status(400).json({ error: 'rejectionReason is required for rejection' });
    }

    if (action === 'REJECT' && !rejectionType) {
      return res.status(400).json({ error: 'rejectionType (SOFT/HARD) is required for rejection' });
    }

    // Fetch proposal with society details
    const [proposals] = await connection.query(
      `SELECT p.*, s.coordinator_id 
       FROM proposals p 
       JOIN societies s ON p.society_id = s.id 
       WHERE p.id = ?`,
      [proposalId]
    );

    if (proposals.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposals[0];
    const hasCoordinator = proposal.coordinator_id !== null;

    // Process action
    let nextStatus;
    const isRejection = action === 'REJECT';
    const isApproval = action === 'APPROVE';
    const isResubmission = action === 'RESUBMIT';

    if (isResubmission) {
      nextStatus = await getNextStatus(proposal.current_status, hasCoordinator, false);
    } else if (isApproval) {
      nextStatus = await getNextStatus(proposal.current_status, hasCoordinator, false);
    } else if (isRejection) {
      // FIXED: SOFT vs HARD rejection logic
      nextStatus = rejectionType === 'HARD' ? 'REJECTED' : 'RETURNED_FOR_REVISION';
    }

    // Update proposal
    const updateData = {
      current_status: nextStatus,
      rejection_reason: isRejection ? rejectionReason : null,
      rejection_type: isRejection ? rejectionType : null,
    };

    if (proposal.current_status === 'PENDING_DIRECTOR_SSC' && isApproval && assignedAsstDirectorId) {
      updateData.assigned_asst_director_id = assignedAsstDirectorId;
    }

    await connection.query('UPDATE proposals SET ? WHERE id = ?', [updateData, proposalId]);

    // Log to approval history
    const historyAction = isRejection ? 'REJECTED' : isResubmission ? 'RESUBMITTED' : 'APPROVED';
    await connection.query(
      'INSERT INTO approval_history (proposal_id, approver_id, action, comments) VALUES (?, ?, ?, ?)',
      [proposalId, userId, historyAction, rejectionReason || null]
    );

    res.json({
      success: true,
      message: `Proposal ${isRejection ? 'rejected' : isResubmission ? 'resubmitted' : 'approved'} successfully`,
      nextStatus,
    });

  } catch (error) {
    console.error('Error in proposal workflow:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Update proposal (before submission or during revision)
 * PUT /proposals/:id
 */
async function updateProposal(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { title, description, eventDate, budgetRequested } = req.body;
    const userId = req.user.id;

    // Verify proposal exists and user owns it
    const [proposals] = await connection.query(
      'SELECT user_id, current_status FROM proposals WHERE id = ?',
      [id]
    );

    if (proposals.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposals[0];

    // Only allow editing if user owns it and status allows editing
    if (proposal.user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own proposals' });
    }

    // Can only edit if returned for revision or rejected (soft)
    if (proposal.current_status !== 'RETURNED_FOR_REVISION') {
      return res.status(400).json({ 
        error: 'Cannot edit proposal',
        message: 'Proposal can only be edited when returned for revision'
      });
    }

    // Update proposal
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (eventDate) updateData.event_date = eventDate;
    if (budgetRequested) updateData.budget_requested = budgetRequested;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await connection.query(
      'UPDATE proposals SET ? WHERE id = ?',
      [updateData, id]
    );

    res.json({
      success: true,
      message: 'Proposal updated successfully',
    });

  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ error: 'Failed to update proposal' });
  } finally {
    connection.release();
  }
}

/**
 * Delete proposal (only if not yet submitted or rejected)
 * DELETE /proposals/:id
 */
async function deleteProposal(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify proposal exists
    const [proposals] = await connection.query(
      'SELECT user_id, current_status FROM proposals WHERE id = ?',
      [id]
    );

    if (proposals.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposals[0];

    // Only owner or admin can delete
    if (proposal.user_id !== userId && userRole !== 'DIRECTOR_SSC') {
      return res.status(403).json({ error: 'You do not have permission to delete this proposal' });
    }

    // Cannot delete approved proposals
    if (proposal.current_status === 'APPROVED') {
      return res.status(400).json({ error: 'Cannot delete approved proposals' });
    }

    // Delete proposal (cascades to attachments and history)
    await connection.query('DELETE FROM proposals WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Proposal deleted successfully',
    });

  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ error: 'Failed to delete proposal' });
  } finally {
    connection.release();
  }
}

/**
 * Get user's draft proposals
 * GET /proposals/drafts/my-drafts
 */
async function getMyDrafts(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    const [drafts] = await connection.query(
      `SELECT d.*, s.name as society_name
       FROM draft_proposals d
       JOIN societies s ON d.society_id = s.id
       WHERE d.user_id = ?
       ORDER BY d.updated_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      drafts,
    });

  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  } finally {
    connection.release();
  }
}

/**
 * Save proposal as draft
 * POST /proposals/drafts
 */
async function saveDraft(req, res) {
  const connection = await pool.getConnection();

  try {
    const { title, description, eventDate, budgetRequested, societyId } = req.body;
    const userId = req.user.id;

    // Get user's society if not provided
    let finalSocietyId = societyId;
    if (!finalSocietyId) {
      const [userSocieties] = await connection.query(
        'SELECT society_id FROM society_roles WHERE user_id = ? AND is_core_leader = TRUE LIMIT 1',
        [userId]
      );

      if (userSocieties.length === 0) {
        return res.status(403).json({ error: 'You are not a core leader of any society' });
      }

      finalSocietyId = userSocieties[0].society_id;
    }

    // Save draft
    const [result] = await connection.query(
      `INSERT INTO draft_proposals (user_id, society_id, title, description, event_date, budget_requested, draft_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, finalSocietyId, title, description, eventDate, budgetRequested, JSON.stringify(req.body)]
    );

    res.status(201).json({
      success: true,
      message: 'Draft saved successfully',
      draftId: result.insertId,
    });

  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  } finally {
    connection.release();
  }
}

/**
 * Update draft
 * PUT /proposals/drafts/:id
 */
async function updateDraft(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { title, description, eventDate, budgetRequested } = req.body;
    const userId = req.user.id;

    // Verify draft exists and user owns it
    const [drafts] = await connection.query(
      'SELECT id FROM draft_proposals WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (drafts.length === 0) {
      return res.status(404).json({ error: 'Draft not found or you do not have permission' });
    }

    // Update draft
    const updateData = {
      title,
      description,
      event_date: eventDate,
      budget_requested: budgetRequested,
      draft_data: JSON.stringify(req.body),
    };

    await connection.query(
      'UPDATE draft_proposals SET ? WHERE id = ?',
      [updateData, id]
    );

    res.json({
      success: true,
      message: 'Draft updated successfully',
    });

  } catch (error) {
    console.error('Update draft error:', error);
    res.status(500).json({ error: 'Failed to update draft' });
  } finally {
    connection.release();
  }
}

/**
 * Delete draft
 * DELETE /proposals/drafts/:id
 */
async function deleteDraft(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    await connection.query(
      'DELETE FROM draft_proposals WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Draft deleted successfully',
    });

  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  } finally {
    connection.release();
  }
}

/**
 * Publish draft as proposal
 * POST /proposals/drafts/:id/publish
 */
async function publishDraft(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get draft
    const [drafts] = await connection.query(
      `SELECT d.*, s.coordinator_id
       FROM draft_proposals d
       JOIN societies s ON d.society_id = s.id
       WHERE d.id = ? AND d.user_id = ?`,
      [id, userId]
    );

    if (drafts.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const draft = drafts[0];

    // Validate draft has required fields
    if (!draft.title || !draft.description || !draft.event_date || !draft.budget_requested) {
      return res.status(400).json({ 
        error: 'Incomplete draft',
        message: 'Please fill in all required fields before publishing'
      });
    }

    const hasCoordinator = draft.coordinator_id !== null;
    const initialStatus = hasCoordinator ? 'PENDING_COORDINATOR' : 'PENDING_DIRECTOR_SSC';

    // Create proposal from draft
    const [result] = await connection.query(
      `INSERT INTO proposals (society_id, user_id, title, description, event_date, budget_requested, current_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [draft.society_id, userId, draft.title, draft.description, draft.event_date, draft.budget_requested, initialStatus]
    );

    // Delete draft
    await connection.query('DELETE FROM draft_proposals WHERE id = ?', [id]);

    res.status(201).json({
      success: true,
      message: 'Draft published successfully',
      proposalId: result.insertId,
      initialStatus,
    });

  } catch (error) {
    console.error('Publish draft error:', error);
    res.status(500).json({ error: 'Failed to publish draft' });
  } finally {
    connection.release();
  }
}

/**
 * Get single proposal by ID
 * GET /proposals/:id
 */
async function getProposalById(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [proposals] = await connection.query(
      `SELECT 
        p.*,
        s.name as society_name,
        u.name as created_by_name,
        u.roll_number as created_by_roll
       FROM proposals p
       JOIN societies s ON p.society_id = s.id
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (proposals.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposals[0];

    // Check permissions
    const isOwner = proposal.user_id === userId;
    const isAdmin = ['DIRECTOR_SSC', 'ASST_DIRECTOR', 'COORDINATOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'].includes(userRole);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to view this proposal' });
    }

    // Get attachments
    const [attachments] = await connection.query(
      'SELECT * FROM proposal_attachments WHERE proposal_id = ?',
      [id]
    );
    proposal.attachments = attachments;

    // Get approval history
    const [history] = await connection.query(
      `SELECT ah.*, u.name as approver_name, u.role as approver_role
       FROM approval_history ah
       LEFT JOIN users u ON ah.approver_id = u.id
       WHERE ah.proposal_id = ?
       ORDER BY ah.created_at DESC`,
      [id]
    );
    proposal.history = history;

    // Get comments
    const [comments] = await connection.query(
      `SELECT pc.*, u.name as user_name, u.role as user_role
       FROM proposal_comments pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.proposal_id = ?
       ORDER BY pc.created_at DESC`,
      [id]
    );
    proposal.comments = comments;

    res.json({
      success: true,
      proposal,
    });

  } catch (error) {
    console.error('Get proposal by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch proposal' });
  } finally {
    connection.release();
  }
}

module.exports = {
  createProposal,
  getProposals,
  getMyProposals,
  handleProposalStatusTransition,
  updateProposal,
  deleteProposal,
  getMyDrafts,
  saveDraft,
  updateDraft,
  deleteDraft,
  publishDraft,
  getProposalById,
};
