const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { validateId } = require('../middleware/validator');

router.get('/search/proposals', searchController.searchProposals);
router.get('/search/users', searchController.searchUsers);
router.get('/search/filters', searchController.getSavedFilters);
router.post('/search/filters', searchController.saveSearchFilter);
router.delete('/search/filters/:id', validateId, searchController.deleteSavedFilter);

module.exports = router;
