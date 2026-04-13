const express = require('express');
const router = express.Router();
const societyController = require('../controllers/societyController');
const { authorize } = require('../middleware/auth');
const { validateId } = require('../middleware/validator');

router.get('/societies', societyController.getAllSocieties);
router.get('/societies/:id', validateId, societyController.getSocietyById);
router.post('/societies', authorize(['DIRECTOR_SSC']), societyController.createSociety);
router.put('/societies/:id', authorize(['DIRECTOR_SSC']), validateId, societyController.updateSociety);
router.post('/societies/cabinet-member', authorize(['DIRECTOR_SSC']), societyController.addCabinetMember);
router.delete('/societies/cabinet-member/:roleId', authorize(['DIRECTOR_SSC']), societyController.removeCabinetMember);

// Coordinator assignment routes
router.put('/societies/:id/coordinator', authorize(['DIRECTOR_SSC', 'SYSTEM_ADMIN']), validateId, societyController.assignCoordinator);
router.get('/coordinators', authorize(['DIRECTOR_SSC', 'SYSTEM_ADMIN']), societyController.getAllCoordinators);

module.exports = router;
