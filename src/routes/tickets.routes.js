const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createTicketController,
  getTicketsController,
  getTicketByIdController,
  updateTicketStatusController,
} = require('../controllers/tickets.controller');

// Get all tickets
router.get('/', protect(), getTicketsController);

// ✅ Get single ticket by ID with full details
router.get('/:ticketId', protect(), getTicketByIdController);

// Update ticket status
router.patch('/:ticketId/status', protect(), updateTicketStatusController);

// Create ticket
router.post('/', protect(), createTicketController);

module.exports = router;
