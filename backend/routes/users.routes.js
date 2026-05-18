const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateId } = require('../middleware/validator');
const { upload } = require('../config/proposalUpload');

router.get('/users/profile', userController.getUserProfile);
router.put('/users/profile', userController.updateUserProfile);
router.post(
  '/users/profile/picture',
  uploadLimiter,
  upload.single('profilePicture'),
  userController.uploadProfilePicture
);
router.get('/users/activity', userController.getUserActivity);
router.put('/users/:id/deactivate', authorize(['DIRECTOR_SSC']), validateId, userController.deactivateUser);
router.put('/users/:id/reactivate', authorize(['DIRECTOR_SSC']), validateId, userController.reactivateUser);
router.post('/users/bulk-import', authorize(['DIRECTOR_SSC']), userController.bulkImportUsers);

// Coordinator management (DIRECTOR_SSC and SYSTEM_ADMIN only)
router.get('/users/coordinators', authorize(['DIRECTOR_SSC', 'SYSTEM_ADMIN', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC', 'COORDINATOR']), userController.getAllCoordinatorUsers);
router.post('/users/coordinators', authorize(['DIRECTOR_SSC', 'SYSTEM_ADMIN']), userController.createCoordinator);
router.delete('/users/coordinators/:id', authorize(['DIRECTOR_SSC', 'SYSTEM_ADMIN']), validateId, userController.deleteCoordinator);

module.exports = router;
