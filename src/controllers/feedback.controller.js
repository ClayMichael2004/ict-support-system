const asyncHandler = require('../utils/asyncHandler');
const {
  submitFeedback,
  getOfficerFeedback,
  getUnreadFeedbackCount,
  markFeedbackAsRead,
} = require('../services/feedback.service');

/**
 * STAFF: Submit feedback after ticket is closed
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
 * OFFICER: Get count of unread feedback (for notification badge)
 */
const getFeedbackCountController = asyncHandler(async (req, res) => {
  const count = await getUnreadFeedbackCount(req.user.id);

  res.status(200).json({
    success: true,
    data: { count },
  });
});

/**
 * OFFICER: Mark all feedback as read
 */
const markFeedbackAsReadController = asyncHandler(async (req, res) => {
  await markFeedbackAsRead(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Feedback marked as read',
  });
});

module.exports = {
  submitFeedbackController,
  getOfficerFeedbackController,
  getFeedbackCountController,
  markFeedbackAsReadController,
};
