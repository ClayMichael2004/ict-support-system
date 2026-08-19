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
  getFeedbackCountController,
  markFeedbackAsReadController,
} = require('../controllers/feedback.controller');

const router = express.Router();

/**
 * ADMIN routes
 */
router.get('/', protect(['ADMIN']), getOfficers);
router.post('/', protect(['ADMIN']), addOfficer);

/**
 * OFFICER routes — staff management
 */
router.get('/staff', protect(['ADMIN', 'OFFICER']), getStaff);
router.post('/staff', protect(['ADMIN', 'OFFICER']), registerStaff);

/**
 * OFFICER / ADMIN routes — feedback
 */
router.get('/feedback', protect(['ADMIN', 'OFFICER']), getOfficerFeedbackController);
router.get('/feedback/count', protect(['ADMIN', 'OFFICER']), getFeedbackCountController);
router.patch('/feedback/read', protect(['ADMIN', 'OFFICER']), markFeedbackAsReadController);

module.exports = router;
