const express = require('express');
const router = express.Router();

const proposalController = require('../controllers/proposalController');
const proposalWorkflowController = require('../controllers/proposalWorkflowController');
const commentController = require('../controllers/commentController');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateProposal, validateId } = require('../middleware/validator');
const { upload } = require('../config/proposalUpload');

router.get('/proposals', proposalController.getProposals);
router.post(
  '/proposals',
  uploadLimiter,
  upload.array('files', 5),
  validateProposal,
  proposalController.createProposal
);
router.get('/proposals/my-proposals', proposalController.getMyProposals);
router.get('/proposals/drafts/my-drafts', proposalController.getMyDrafts);
router.post('/proposals/drafts', proposalController.saveDraft);
router.put('/proposals/drafts/:id', validateId, proposalController.updateDraft);
router.delete('/proposals/drafts/:id', validateId, proposalController.deleteDraft);
router.post('/proposals/drafts/:id/publish', validateId, proposalController.publishDraft);
router.post('/proposals/next-status', proposalWorkflowController.processProposalNextStatus);
router.get('/proposals/:id', validateId, proposalController.getProposalById);
router.put('/proposals/:id', validateId, proposalController.updateProposal);
router.delete('/proposals/:id', validateId, proposalController.deleteProposal);

router.get('/proposals/:id/comments', validateId, commentController.getComments);
router.post('/proposals/:id/comments', validateId, commentController.addComment);
router.put('/proposals/:proposalId/comments/:commentId', commentController.updateComment);
router.delete('/proposals/:proposalId/comments/:commentId', commentController.deleteComment);

module.exports = router;
