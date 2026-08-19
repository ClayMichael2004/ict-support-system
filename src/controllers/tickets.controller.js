const asyncHandler = require('../utils/asyncHandler');
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus
} = require('../services/tickets.service');

const { logAction } = require('../services/audit.service');
const ApiError = require('../utils/ApiError');
const pool = require('../config/db');

const createTicketController = asyncHandler(async (req, res) => {
  const { description, locationId, categoryId } = req.body;

  if (!description || !locationId || !categoryId) {
    throw new ApiError(400, 'All fields are required');
  }

  // Get the officer assigned to this location
  const [locationRows] = await pool.query(
    'SELECT officer_id FROM locations WHERE id = ? AND is_active = 1',
    [locationId]
  );

  if (locationRows.length === 0) {
    throw new ApiError(400, 'Invalid location selected');
  }

  const assignedOfficerId = locationRows[0].officer_id;

  // Get category name for title
  const [catRows] = await pool.query(
    'SELECT name FROM categories WHERE id = ?',
    [categoryId]
  );
  const catName = catRows.length ? catRows[0].name : `Category ${categoryId}`;

  const ticket = await createTicket({
    title: catName,
    description,
    userId: req.user.id,
    locationId,
    assignedOfficerId,
    categoryId,
  });

  try {
    await logAction({
      userId: req.user.id,
      action: 'CREATE_TICKET',
      entity: 'TICKET',
      entityId: ticket.id,
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }

  res.status(201).json({
    success: true,
    data: ticket,
    message: 'Ticket created successfully',
  });
});

const getTicketsController = asyncHandler(async (req, res) => {
  const tickets = await getTickets(req.user);
  res.status(200).json({
    success: true,
    data: tickets,
  });
});

// ✅ NEW: Get single ticket with full details
const getTicketByIdController = asyncHandler(async (req, res) => {
  const ticket = await getTicketById(req.params.ticketId, req.user);
  res.status(200).json({
    success: true,
    data: ticket,
  });
});

const updateTicketStatusController = asyncHandler(async (req, res) => {
  const updatedTicket = await updateTicketStatus({
    ticketId: req.params.ticketId,
    status: req.body.status,
    user: req.user,
  });

  try {
    await logAction({
      userId: req.user.id,
      action: `UPDATE_STATUS_${req.body.status}`,
      entity: 'TICKET',
      entityId: req.params.ticketId,
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }

  res.status(200).json({
    success: true,
    data: updatedTicket,
    message: `Ticket status updated to ${req.body.status}`,
  });
});

module.exports = {
  createTicketController,
  getTicketsController,
  getTicketByIdController,
  updateTicketStatusController,
};
