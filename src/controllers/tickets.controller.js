const asyncHandler = require('../utils/asyncHandler');
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus
} = require('../services/tickets.service');

const createTicketController = asyncHandler(async (req, res) => {
  const { description, locationId, categoryId } = req.body;

  if (!description || !locationId || !categoryId) {
    res.status(400);
    throw new Error('All fields are required');
  }

  // ✅ Get the officer assigned to this location
  const pool = require('../config/db');
  const [locationRows] = await pool.query(
    'SELECT officer_id FROM locations WHERE id = ? AND is_active = 1',
    [locationId]
  );

  if (locationRows.length === 0) {
    res.status(400);
    throw new Error('Invalid location selected');
  }

  const assignedOfficerId = locationRows[0].officer_id;

  const ticket = await createTicket({
    title: `Category ${categoryId}`,
    description,
    userId: req.user.id,
    locationId,
    assignedOfficerId,
  });

  res.status(201).json({
    success: true,
    data: ticket,
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

  res.status(200).json({
    success: true,
    data: updatedTicket,
  });
});

module.exports = {
  createTicketController,
  getTicketsController,
  getTicketByIdController,
  updateTicketStatusController,
};
