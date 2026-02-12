const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  getOfficers,
  addOfficer,
  registerStaff,
  getStaff
} = require('../controllers/officers.controller');
const {
  getOfficerFeedbackController,
  getFeedbackCountController
} = require('../controllers/feedback.controller');

const router = express.Router();

/**
 * ADMIN routes
 */
router.get('/', protect(['ADMIN']), getOfficers);
router.post('/', protect(['ADMIN']), addOfficer);

/**
 * OFFICER routes — view and register staff
 * Both ADMIN and OFFICER can access these
 */
router.get('/staff', protect(['ADMIN', 'OFFICER']), getStaff);
router.post('/staff', protect(['ADMIN', 'OFFICER']), registerStaff);

/**
 * OFFICER routes — feedback
 */
router.get('/feedback', protect(['OFFICER']), getOfficerFeedbackController);
router.get('/feedback/count', protect(['OFFICER']), getFeedbackCountController);

module.exports = router;
