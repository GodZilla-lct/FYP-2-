const pool = require('../config/database');

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
      // Coordinator approved → move to Director SSC
      return 'PENDING_DIRECTOR_SSC';

    case 'PENDING_DIRECTOR_SSC':
      // Director SSC approved → move to Assistant Director
      return 'PENDING_ASST_DIRECTOR';

    case 'PENDING_ASST_DIRECTOR':
      // Assistant Director approved → move to Finance Secretary
      return 'PENDING_FINANCE_SECRETARY';

    case 'PENDING_FINANCE_SECRETARY':
      // Finance Secretary approved → move to Registrar
      return 'PENDING_REGISTRAR';

    case 'PENDING_REGISTRAR':
      // Registrar approved → move to VC
      return 'PENDING_VC';

    case 'PENDING_VC':
      // VC approved → APPROVED (final status)
      return 'APPROVED';

    case 'RETURNED_FOR_REVISION':
      // President resubmits → check if coordinator exists
      // If NO coordinator, skip directly to PENDING_DIRECTOR_SSC
      return hasCoordinator ? 'PENDING_COORDINATOR' : 'PENDING_DIRECTOR_SSC';

    default:
      throw new Error(`Invalid current status: ${currentStatus}`);
  }
}

/**
 * Main workflow handler for proposal status transitions
 * POST /proposals/next-status
 * Handles: APPROVE, REJECT (SOFT/HARD), RESUBMIT
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
      `SELECT p.*, s.coordinator_id, s.president_id 
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

    // ===== AUTHORIZATION CHECKS =====
    const isRejection = action === 'REJECT';
    const isApproval = action === 'APPROVE';
    const isResubmission = action === 'RESUBMIT';

    // Validate user can perform this action
    if (isResubmission) {
      // Only president can resubmit
      if (userRole !== 'PRESIDENT' || userId !== proposal.president_id) {
        return res.status(403).json({ error: 'Only the society president can resubmit' });
      }

      if (proposal.current_status !== 'RETURNED_FOR_REVISION') {
        return res.status(400).json({ error: 'Proposal must be in RETURNED_FOR_REVISION status to resubmit' });
      }
    } else if (isApproval || isRejection) {
      // Validate approver role matches current status
      const roleStatusMap = {
        PENDING_COORDINATOR: 'COORDINATOR',
        PENDING_DIRECTOR_SSC: 'DIRECTOR_SSC',
        PENDING_ASST_DIRECTOR: 'ASST_DIRECTOR',
        PENDING_FINANCE_SECRETARY: 'FINANCE_SECRETARY',
        PENDING_REGISTRAR: 'REGISTRAR',
        PENDING_VC: 'VC',
      };

      const requiredRole = roleStatusMap[proposal.current_status];

      if (!requiredRole) {
        return res.status(400).json({ error: `Cannot approve/reject proposal in ${proposal.current_status} status` });
      }

      if (userRole !== requiredRole) {
        return res.status(403).json({ error: `Only ${requiredRole} can approve/reject at this stage` });
      }

      // Additional check for Assistant Director
      if (userRole === 'ASST_DIRECTOR' && proposal.assigned_asst_director_id !== userId) {
        return res.status(403).json({ error: 'This proposal is not assigned to you' });
      }
    }

    // ===== PROCESS ACTION =====
    let nextStatus;

    if (isResubmission) {
      nextStatus = await getNextStatus(proposal.current_status, hasCoordinator, false);
    } else if (isApproval) {
      nextStatus = await getNextStatus(proposal.current_status, hasCoordinator, false);
    } else if (isRejection) {
      // For HARD rejection, status is REJECTED (final)
      // For SOFT rejection, status is RETURNED_FOR_REVISION
      nextStatus = rejectionType === 'HARD' ? 'REJECTED' : 'RETURNED_FOR_REVISION';
    }

    // ===== SPECIAL LOGIC: Director SSC assigns to Assistant Director =====
    let updateData = {
      current_status: nextStatus,
      rejection_reason: isRejection ? rejectionReason : null,
      rejection_type: isRejection ? rejectionType : null,
    };

    if (proposal.current_status === 'PENDING_DIRECTOR_SSC' && isApproval && assignedAsstDirectorId) {
      // Validate assigned AD exists and has correct role
      const [adUsers] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [assignedAsstDirectorId, 'ASST_DIRECTOR']
      );

      if (adUsers.length === 0) {
        return res.status(400).json({ error: 'Invalid Assistant Director ID' });
      }

      updateData.assigned_asst_director_id = assignedAsstDirectorId;
    }

    // ===== UPDATE PROPOSAL =====
    await connection.query('UPDATE proposals SET ? WHERE id = ?', [updateData, proposalId]);

    // ===== LOG TO APPROVAL HISTORY =====
    const historyAction = isRejection ? 'REJECTED' : isResubmission ? 'RESUBMITTED' : 'APPROVED';
    await connection.query(
      'INSERT INTO approval_history (proposal_id, approver_id, action, comments) VALUES (?, ?, ?, ?)',
      [proposalId, userId, historyAction, rejectionReason || null]
    );

    // ===== FETCH UPDATED PROPOSAL =====
    const [updatedProposals] = await connection.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    res.json({
      success: true,
      message: `Proposal ${isRejection ? 'rejected' : isResubmission ? 'resubmitted' : 'approved'} successfully`,
      proposal: updatedProposals[0],
      nextStatus,
    });
  } catch (error) {
    console.error('Error in proposal workflow:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await connection.release();
  }
}

/**
 * Get proposal details with full workflow context
 * GET /proposals/:id
 */
async function getProposalDetails(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    const [proposals] = await connection.query(
      `SELECT p.*, s.name as society_name, s.coordinator_id, s.president_id 
       FROM proposals p 
       JOIN societies s ON p.society_id = s.id 
       WHERE p.id = ?`,
      [id]
    );

    if (proposals.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposals[0];

    // Fetch attachments
    const [attachments] = await connection.query(
      'SELECT id, file_url, file_name, uploaded_at FROM proposal_attachments WHERE proposal_id = ?',
      [id]
    );

    // Fetch approval history
    const [history] = await connection.query(
      `SELECT ah.*, u.name as approver_name, u.role 
       FROM approval_history ah 
       JOIN users u ON ah.approver_id = u.id 
       WHERE ah.proposal_id = ? 
       ORDER BY ah.created_at DESC`,
      [id]
    );

    res.json({
      proposal,
      attachments,
      approvalHistory: history,
    });
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Create a new proposal
 * POST /proposals
 * Implements Null Coordinator Check: If coordinator_id IS NULL, skip to PENDING_DIRECTOR_SSC
 */
async function createProposal(req, res) {
  const connection = await pool.getConnection();

  try {
    const { societyId, title, description, eventDate, budgetRequested } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!societyId || !title || !description || !eventDate || !budgetRequested) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user is president of this society
    const [societies] = await connection.query(
      'SELECT coordinator_id FROM societies WHERE id = ? AND president_id = ?',
      [societyId, userId]
    );

    if (societies.length === 0) {
      return res.status(403).json({ error: 'You are not the president of this society' });
    }

    const hasCoordinator = societies[0].coordinator_id !== null;
    // Null Coordinator Check: If no coordinator, skip directly to Director SSC
    const initialStatus = hasCoordinator ? 'PENDING_COORDINATOR' : 'PENDING_DIRECTOR_SSC';

    // Create proposal
    const [result] = await connection.query(
      `INSERT INTO proposals (society_id, title, description, event_date, budget_requested, current_status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [societyId, title, description, eventDate, budgetRequested, initialStatus]
    );

    res.status(201).json({
      success: true,
      message: 'Proposal created successfully',
      proposalId: result.insertId,
      initialStatus,
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Upload attachment to proposal
 * POST /proposals/:id/attachments
 */
async function uploadAttachment(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      return res.status(400).json({ error: 'fileUrl and fileName are required' });
    }

    // Verify proposal exists
    const [proposals] = await connection.query('SELECT id FROM proposals WHERE id = ?', [id]);

    if (proposals.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Insert attachment
    const [result] = await connection.query(
      'INSERT INTO proposal_attachments (proposal_id, file_url, file_name) VALUES (?, ?, ?)',
      [id, fileUrl, fileName]
    );

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      attachmentId: result.insertId,
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Update society hierarchy (Admin only)
 * PUT /societies/:id
 * Allows updating all 7 hierarchy slots: President, Sr VP, VP Male, VP Female, GS Male, GS Female, Coordinator
 */
async function updateSocietyHierarchy(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { presidentId, seniorVpId, vpMaleId, vpFemaleId, gsMaleId, gsFemaleId, coordinatorId } = req.body;
    const userRole = req.user.role;

    // Only DIRECTOR_SSC can update society hierarchy
    if (userRole !== 'DIRECTOR_SSC') {
      return res.status(403).json({ error: 'Only Director SSC can update society hierarchy' });
    }

    // Validate input - at least president is required
    if (!presidentId) {
      return res.status(400).json({ error: 'presidentId is required' });
    }

    // Verify society exists
    const [societies] = await connection.query('SELECT id FROM societies WHERE id = ?', [id]);
    if (societies.length === 0) {
      return res.status(404).json({ error: 'Society not found' });
    }

    // Verify president exists and has PRESIDENT or SOCIETY_LEADER role
    const [presidents] = await connection.query(
      'SELECT id FROM users WHERE id = ? AND role IN (?, ?)',
      [presidentId, 'PRESIDENT', 'SOCIETY_LEADER']
    );
    if (presidents.length === 0) {
      return res.status(400).json({ error: 'Invalid president ID' });
    }

    // Helper function to validate user exists with SOCIETY_LEADER role
    const validateLeader = async (userId) => {
      if (!userId) return true; // Optional field
      const [users] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [userId, 'SOCIETY_LEADER']
      );
      return users.length > 0;
    };

    // Validate all leadership positions
    const validSrVp = await validateLeader(seniorVpId);
    const validVpMale = await validateLeader(vpMaleId);
    const validVpFemale = await validateLeader(vpFemaleId);
    const validGsMale = await validateLeader(gsMaleId);
    const validGsFemale = await validateLeader(gsFemaleId);

    if (!validSrVp || !validVpMale || !validVpFemale || !validGsMale || !validGsFemale) {
      return res.status(400).json({ error: 'Invalid leadership position ID' });
    }

    // Verify coordinator exists (if provided) and has COORDINATOR role
    if (coordinatorId) {
      const [coordinators] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [coordinatorId, 'COORDINATOR']
      );
      if (coordinators.length === 0) {
        return res.status(400).json({ error: 'Invalid coordinator ID' });
      }
    }

    // Update society with all 7 hierarchy slots
    const updateData = {
      president_id: presidentId,
      senior_vp_id: seniorVpId || null,
      vp_male_id: vpMaleId || null,
      vp_female_id: vpFemaleId || null,
      gs_male_id: gsMaleId || null,
      gs_female_id: gsFemaleId || null,
      coordinator_id: coordinatorId || null,
    };

    await connection.query('UPDATE societies SET ? WHERE id = ?', [updateData, id]);

    res.json({
      success: true,
      message: 'Society hierarchy updated successfully',
      societyId: id,
      hierarchy: updateData,
    });
  } catch (error) {
    console.error('Error updating society hierarchy:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Get all societies with complete hierarchy info
 * GET /societies
 */
async function getSocieties(req, res) {
  const connection = await pool.getConnection();

  try {
    const [societies] = await connection.query(
      `SELECT s.id, s.name, 
              s.president_id, p.name as president_name,
              s.senior_vp_id, svp.name as senior_vp_name,
              s.vp_male_id, vpm.name as vp_male_name,
              s.vp_female_id, vpf.name as vp_female_name,
              s.gs_male_id, gsm.name as gs_male_name,
              s.gs_female_id, gsf.name as gs_female_name,
              s.coordinator_id, c.name as coordinator_name
       FROM societies s
       LEFT JOIN users p ON s.president_id = p.id
       LEFT JOIN users svp ON s.senior_vp_id = svp.id
       LEFT JOIN users vpm ON s.vp_male_id = vpm.id
       LEFT JOIN users vpf ON s.vp_female_id = vpf.id
       LEFT JOIN users gsm ON s.gs_male_id = gsm.id
       LEFT JOIN users gsf ON s.gs_female_id = gsf.id
       LEFT JOIN users c ON s.coordinator_id = c.id
       ORDER BY s.name ASC`
    );

    res.json({
      success: true,
      societies,
    });
  } catch (error) {
    console.error('Error fetching societies:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Get user's dashboard based on role
 * GET /dashboard
 * Routes users to appropriate dashboard based on their role
 */
async function getUserDashboard(req, res) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user is assigned to any society leadership position
    const [societyAssignments] = await connection.query(
      `SELECT s.id, s.name, 
              CASE 
                WHEN s.president_id = ? THEN 'PRESIDENT'
                WHEN s.senior_vp_id = ? THEN 'SENIOR_VP'
                WHEN s.vp_male_id = ? THEN 'VP_MALE'
                WHEN s.vp_female_id = ? THEN 'VP_FEMALE'
                WHEN s.gs_male_id = ? THEN 'GS_MALE'
                WHEN s.gs_female_id = ? THEN 'GS_FEMALE'
              END as position
       FROM societies s
       WHERE s.president_id = ? OR s.senior_vp_id = ? OR s.vp_male_id = ? 
             OR s.vp_female_id = ? OR s.gs_male_id = ? OR s.gs_female_id = ?`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );

    if (societyAssignments.length > 0) {
      // User is a society leader - route to Co-Pilot Dashboard
      return res.json({
        dashboardType: 'SOCIETY_LEADER',
        societies: societyAssignments,
        message: 'User is assigned to society leadership'
      });
    }

    // Route based on role
    if (userRole === 'DIRECTOR_SSC') {
      return res.json({
        dashboardType: 'ADMIN_HIERARCHY',
        message: 'Director SSC can manage society hierarchy'
      });
    }

    if (['ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'].includes(userRole)) {
      return res.json({
        dashboardType: 'APPROVER',
        role: userRole,
        message: 'User is an approver in the workflow'
      });
    }

    res.json({
      dashboardType: 'UNKNOWN',
      message: 'User role not recognized'
    });
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Login endpoint
 * POST /auth/login
 */
async function login(req, res) {
  const connection = await pool.getConnection();

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const [users] = await connection.query(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // For demo purposes, accept 'password123' for all users
    if (password !== 'password123') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get society info if user is a society leader
    let societyInfo = null;
    if (user.role === 'SOCIETY_LEADER' || user.role === 'PRESIDENT') {
      const [societies] = await connection.query(
        `SELECT s.id, s.name FROM societies s 
         WHERE s.president_id = ? OR s.senior_vp_id = ? OR s.vp_male_id = ? 
            OR s.vp_female_id = ? OR s.gs_male_id = ? OR s.gs_female_id = ?`,
        [user.id, user.id, user.id, user.id, user.id, user.id]
      );
      
      if (societies.length > 0) {
        societyInfo = societies[0];
      }
    }

    res.json({
      success: true,
      user: {
        ...user,
        society: societyInfo
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

/**
 * Get all users (for dropdowns in hierarchy manager)
 * GET /users
 * Auth: DIRECTOR_SSC role required
 */
async function getUsers(req, res) {
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query(
      'SELECT id, name, email, role FROM users WHERE role IN (?, ?, ?) ORDER BY name ASC',
      ['SOCIETY_LEADER', 'COORDINATOR', 'PRESIDENT']
    );

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

module.exports = {
  handleProposalStatusTransition,
  getProposalDetails,
  createProposal,
  uploadAttachment,
  updateSocietyHierarchy,
  getSocieties,
  getUserDashboard,
  getUsers,
  login,
  getNextStatus, // Export for testing
};
