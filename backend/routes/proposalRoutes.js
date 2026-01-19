const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const societyController = require('../controllers/societyController');
const { authenticate, authorize } = require('../middleware/auth');

// ===== PROPOSAL ROUTES =====

/**
 * Get proposals based on user role
 * GET /proposals
 * CRITICAL FIX: Admin sees ALL proposals, Society leaders see only their society's proposals
 */
router.get('/proposals', authenticate, proposalController.getProposals);

/**
 * Create a new proposal with file upload
 * POST /proposals
 * FIXED: Uses multer for file upload, auto-links to user's society
 */
router.post('/proposals', 
  authenticate, 
  proposalController.upload.array('files', 5), // Max 5 files
  proposalController.createProposal
);

/**
 * Get my society's proposals
 * GET /proposals/my-proposals
 * FIXED: Returns proposals instantly after creation
 */
router.get('/proposals/my-proposals', authenticate, proposalController.getMyProposals);

/**
 * Handle proposal status transitions
 * POST /proposals/next-status
 * FIXED: Proper SOFT vs HARD rejection logic
 */
router.post('/proposals/next-status', authenticate, proposalController.handleProposalStatusTransition);

// ===== SOCIETY ROUTES =====

/**
 * Get all societies with dynamic roles
 * GET /societies
 */
router.get('/societies', authenticate, authorize(['DIRECTOR_SSC']), societyController.getSocieties);

/**
 * Add or update a role in a society
 * POST /societies/:id/roles
 * FIXED: Auto-create user if doesn't exist, handle text inputs
 */
router.post('/societies/:id/roles', 
  authenticate, 
  authorize(['DIRECTOR_SSC']), 
  societyController.addOrUpdateSocietyRole
);

/**
 * Remove a role from a society
 * DELETE /societies/:societyId/roles/:roleId
 */
router.delete('/societies/:societyId/roles/:roleId', 
  authenticate, 
  authorize(['DIRECTOR_SSC']), 
  societyController.removeSocietyRole
);

/**
 * Update society coordinator
 * PUT /societies/:id/coordinator
 */
router.put('/societies/:id/coordinator', 
  authenticate, 
  authorize(['DIRECTOR_SSC']), 
  societyController.updateSocietyCoordinator
);

// ===== USER ROUTES =====

/**
 * Get users by role
 * GET /users/by-role/:role
 */
router.get('/users/by-role/:role', 
  authenticate, 
  authorize(['DIRECTOR_SSC']), 
  societyController.getUsersByRole
);

// ===== AUTH ROUTES =====

/**
 * Login endpoint
 * POST /auth/login
 */
router.post('/auth/login', login);

/**
 * Login endpoint - FIXED with proper user lookup
 */
async function login(req, res) {
  const pool = require('../config/database');
  const connection = await pool.getConnection();

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const [users] = await connection.query(
      'SELECT id, name, email, roll_number, role FROM users WHERE email = ?',
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

    // Check if user is a core leader (can access society dashboard)
    let canAccessSocietyDashboard = false;
    if (user.role === 'STUDENT') {
      const [coreRoles] = await connection.query(
        'SELECT COUNT(*) as count FROM society_roles WHERE user_id = ? AND is_core_leader = TRUE',
        [user.id]
      );
      canAccessSocietyDashboard = coreRoles[0].count > 0;
    }

    res.json({
      success: true,
      user: {
        ...user,
        canAccessSocietyDashboard
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await connection.release();
  }
}

module.exports = router;
