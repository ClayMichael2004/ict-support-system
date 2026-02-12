const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

const createTicket = async ({ title, description, userId, locationId, assignedOfficerId }) => {
  if (!title || !description || !userId || !locationId || !assignedOfficerId) {
    throw new ApiError(400, 'All fields are required to create a ticket');
  }

  const [result] = await pool.query(
    `INSERT INTO tickets (title, description, user_id, location_id, assigned_officer_id)
     VALUES (?, ?, ?, ?, ?)`,
    [title, description, userId, locationId, assignedOfficerId]
  );

  return {
    id: result.insertId,
    title,
    description,
    status: 'OPEN',
    user_id: userId,
    location_id: locationId,
    assigned_officer_id: assignedOfficerId,
  };
};

const getTickets = async (user) => {
  if (!user || !user.id) {
    throw new ApiError(401, 'Unauthenticated');
  }

  // Normalize role safely
  const role =
    user.role ||
    user.role_name ||
    (user.role_id === 1 ? 'ADMIN' :
     user.role_id === 2 ? 'OFFICER' :
     'USER');

  let query = '';
  let params = [];

  if (role === 'ADMIN') {
    query = `
      SELECT t.*, l.name AS location_name
      FROM tickets t
      LEFT JOIN locations l ON t.location_id = l.id
    `;
  } else if (role === 'OFFICER') {
    query = `
      SELECT t.*, l.name AS location_name
      FROM tickets t
      LEFT JOIN locations l ON t.location_id = l.id
      WHERE t.assigned_officer_id = ?
    `;
    params = [user.id];
  } else {
    // ✅ STAFF / USER — ONLY THEIR OWN TICKETS
    query = `
      SELECT t.*, l.name AS location_name
      FROM tickets t
      LEFT JOIN locations l ON t.location_id = l.id
      WHERE t.user_id = ?
    `;
    params = [user.id];
  }

  const [rows] = await pool.query(query, params);
  return rows;
};

// ✅ NEW: Get detailed ticket information
const getTicketById = async (ticketId, user) => {
  if (!user || !user.id) {
    throw new ApiError(401, 'Unauthenticated');
  }

  const query = `
    SELECT 
      t.*,
      l.name AS location_name,
      l.building AS location_building,
      u.full_name AS user_full_name,
      u.email AS user_email,
      o.full_name AS officer_full_name
    FROM tickets t
    LEFT JOIN locations l ON t.location_id = l.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users o ON t.assigned_officer_id = o.id
    WHERE t.id = ?
  `;

  const [rows] = await pool.query(query, [ticketId]);
  
  if (!rows.length) {
    throw new ApiError(404, 'Ticket not found');
  }

  const ticket = rows[0];

  // Normalize role
  const role =
    user.role ||
    user.role_name ||
    (user.role_id === 1 ? 'ADMIN' :
     user.role_id === 2 ? 'OFFICER' :
     'USER');

  // Check permissions
  if (role === 'OFFICER' && ticket.assigned_officer_id !== user.id) {
    throw new ApiError(403, 'You do not have permission to view this ticket');
  } else if (role === 'USER' && ticket.user_id !== user.id) {
    throw new ApiError(403, 'You do not have permission to view this ticket');
  }

  return ticket;
};

const updateTicketStatus = async ({ ticketId, status, user }) => {
  const validStatuses = ['OPEN', 'IN_PROGRESS', 'CLOSED'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }

  const [ticketRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  if (!ticketRows.length) throw new ApiError(404, 'Ticket not found');

  const ticket = ticketRows[0];

  // Officer restriction
  if (
    (user.role === 'OFFICER' || user.role_id === 2) &&
    ticket.assigned_officer_id !== user.id
  ) {
    throw new ApiError(403, 'You cannot update this ticket');
  }

  let solvedByName = ticket.solved_by_name;
  let closedAt = ticket.closed_at;

  if (status === 'CLOSED') {
    solvedByName = user.fullName || user.full_name || 'Officer';
    closedAt = new Date();
  }

  await pool.query(
    'UPDATE tickets SET status = ?, solved_by_name = ?, closed_at = ? WHERE id = ?',
    [status, solvedByName, closedAt, ticketId]
  );

  const [updatedRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  return updatedRows[0];
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
};
