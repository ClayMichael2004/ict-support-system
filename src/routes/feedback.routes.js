const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  submitFeedbackController,
  getOfficerFeedbackController,
  getFeedbackCountController,
  markFeedbackAsReadController,
} = require('../controllers/feedback.controller');

const router = express.Router();

// STAFF / ADMIN: Submit feedback
router.post('/', protect(['STAFF', 'ADMIN']), submitFeedbackController);

// OFFICER / ADMIN: Feedback endpoints
router.get('/officer', protect(['OFFICER', 'ADMIN']), getOfficerFeedbackController);
router.get('/count', protect(['OFFICER', 'ADMIN']), getFeedbackCountController);
router.patch('/read', protect(['OFFICER', 'ADMIN']), markFeedbackAsReadController);

module.exports = router;
