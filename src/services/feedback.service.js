const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

const submitFeedback = async ({ ticketId, rating, comment, staffId }) => {
  // 1. Check ticket exists and is CLOSED
  const [ticketRows] = await pool.query(
    'SELECT id, status, user_id FROM tickets WHERE id = ?',
    [ticketId]
  );

  if (ticketRows.length === 0) {
    throw new ApiError(404, 'Ticket not found');
  }

  const ticket = ticketRows[0];

  if (ticket.status !== 'CLOSED') {
    throw new ApiError(400, 'Feedback allowed only for closed tickets');
  }

  // ✅ Parse both as integers for correct comparison
  if (parseInt(ticket.user_id) !== parseInt(staffId)) {
    throw new ApiError(403, 'You can only rate your own ticket');
  }

  // 2. Prevent duplicate feedback
  const [existing] = await pool.query(
    'SELECT id FROM ticket_feedback WHERE ticket_id = ?',
    [ticketId]
  );

  if (existing.length > 0) {
    throw new ApiError(400, 'Feedback already submitted for this ticket');
  }

  // 3. Parse rating and comment properly
  const parsedRating = rating ? parseInt(rating) : null;
  const parsedComment = comment && comment.trim() !== '' ? comment.trim() : null;

  // 4. Insert feedback
  const [result] = await pool.query(
    `INSERT INTO ticket_feedback (ticket_id, rating, comment)
     VALUES (?, ?, ?)`,
    [ticketId, parsedRating, parsedComment]
  );

  return {
    id: result.insertId,
    ticketId,
    rating: parsedRating,
    comment: parsedComment,
  };
};

/**
 * Get all feedback for tickets assigned to this officer
 */
const getOfficerFeedback = async (officerId) => {
  const [rows] = await pool.query(
    `SELECT 
       f.id,
       f.ticket_id,
       f.rating,
       f.comment,
       f.is_read,
       f.created_at,
       t.title AS ticket_title,
       t.description AS ticket_description,
       u.full_name AS staff_name,
       u.email AS staff_email
     FROM ticket_feedback f
     INNER JOIN tickets t ON f.ticket_id = t.id
     INNER JOIN users u ON t.user_id = u.id
     WHERE t.assigned_officer_id = ?
     ORDER BY f.created_at DESC`,
    [officerId]
  );

  return rows;
};

/**
 * Get count of UNREAD feedback (for notification badge)
 */
const getUnreadFeedbackCount = async (officerId) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM ticket_feedback f
     INNER JOIN tickets t ON f.ticket_id = t.id
     WHERE t.assigned_officer_id = ?
     AND f.is_read = 0`,
    [officerId]
  );

  return rows[0].count;
};

/**
 * Mark all feedback as read for this officer
 */
const markFeedbackAsRead = async (officerId) => {
  await pool.query(
    `UPDATE ticket_feedback f
     INNER JOIN tickets t ON f.ticket_id = t.id
     SET f.is_read = 1
     WHERE t.assigned_officer_id = ?
     AND f.is_read = 0`,
    [officerId]
  );
};

module.exports = {
  submitFeedback,
  getOfficerFeedback,
  getUnreadFeedbackCount,
  markFeedbackAsRead,
};
