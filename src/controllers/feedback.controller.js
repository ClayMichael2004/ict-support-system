const asyncHandler = require('../utils/asyncHandler');
const { submitFeedback, getOfficerFeedback, getUnreadFeedbackCount } = require('../services/feedback.service');

/**
 * USER / STAFF: Submit optional feedback after ticket is closed
 */
const submitFeedbackController = asyncHandler(async (req, res) => {
  const { ticketId, rating, comment } = req.body;

  const feedback = await submitFeedback({
    ticketId,
    rating,
    comment,
    staffId: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully',
    data: feedback,
  });
});

/**
 * OFFICER: Get all feedback for officer's assigned tickets
 */
const getOfficerFeedbackController = asyncHandler(async (req, res) => {
  const feedback = await getOfficerFeedback(req.user.id);
  
  res.status(200).json({
    success: true,
    data: feedback,
  });
});

/**
 * OFFICER: Get count of new feedback (for notification badge)
 */
const getFeedbackCountController = asyncHandler(async (req, res) => {
  const count = await getUnreadFeedbackCount(req.user.id);
  
  res.status(200).json({
    success: true,
    data: { count },
  });
});

module.exports = {
  submitFeedbackController,
  getOfficerFeedbackController,
  getFeedbackCountController,
};
