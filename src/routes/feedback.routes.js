const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { submitFeedbackController } = require('../controllers/feedback.controller');

const router = express.Router();

// STAFF ONLY
router.post('/', protect(['STAFF']), submitFeedbackController);

module.exports = router;
