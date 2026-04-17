/**
 * Cabinet Routes
 * Handles Society Cabinet ledger operations
 * 
 * IMPORTANT: This module is completely isolated from user authentication.
 * Cabinet members listed here do NOT receive portal access or login credentials.
 * 
 * These routes manage historical text-only records of society cabinet members.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const cabinetController = require('../controllers/cabinetController');
const { validate } = require('../middleware/validateRequest');
const {
  addCabinetMemberSchema,
  updateCabinetMemberSchema,
  getCabinetMembersSchema,
  deleteCabinetMemberSchema,
} = require('../validators/societyValidator');

// All cabinet routes require authentication
router.use(authenticate);

/**
 * POST /api/cabinet/add
 * Add a new cabinet member to the historical ledger
 */
router.post('/add', validate(addCabinetMemberSchema), cabinetController.addCabinetMember);

/**
 * GET /api/cabinet/:societyId
 * Get all cabinet members for a specific society
 */
router.get('/:societyId', validate(getCabinetMembersSchema), cabinetController.getCabinetMembers);

/**
 * GET /api/cabinet/member/:memberId
 * Get a single cabinet member by ID
 */
router.get('/member/:memberId', cabinetController.getCabinetMemberById);

/**
 * PUT /api/cabinet/:memberId
 * Update a cabinet member record
 */
router.put('/:memberId', validate(updateCabinetMemberSchema), cabinetController.updateCabinetMember);

/**
 * DELETE /api/cabinet/:memberId
 * Delete a cabinet member record
 */
router.delete('/:memberId', validate(deleteCabinetMemberSchema), cabinetController.deleteCabinetMember);

module.exports = router;
