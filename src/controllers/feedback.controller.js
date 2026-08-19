const asyncHandler = require('../utils/asyncHandler');
const {
  submitFeedback,
  getOfficerFeedback,
  getUnreadFeedbackCount,
  markFeedbackAsRead,
} = require('../services/feedback.service');

const { logAction } = require('../services/audit.service');

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

  try {
    await logAction({
      userId: req.user.id,
      action: 'SUBMIT_FEEDBACK',
      entity: 'FEEDBACK',
      entityId: feedback.id,
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }

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
  const isAdmin = req.user && req.user.role === 'ADMIN';
  const feedback = await getOfficerFeedback(req.user.id, isAdmin);

  res.status(200).json({
    success: true,
    data: feedback,
  });
});

/**
 * OFFICER: Get count of unread feedback (for notification badge)
 */
const getFeedbackCountController = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'ADMIN';
  const count = await getUnreadFeedbackCount(req.user.id, isAdmin);

  res.status(200).json({
    success: true,
    data: { count },
  });
});

/**
 * OFFICER: Mark all feedback as read
 */
const markFeedbackAsReadController = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'ADMIN';
  await markFeedbackAsRead(req.user.id, isAdmin);

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
