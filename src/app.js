require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const officersRoutes = require('./routes/officers.routes');
const locationsRoutes = require('./routes/locations.routes');
const ticketsRoutes = require('./routes/tickets.routes');
const auditRoutes = require('./routes/audit.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const categoryRoutes = require('./routes/categories.routes');
// Error handler
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'ICT Support System API is running' });
});

// ---------------- ROUTES ---------------- //
// Auth
app.use('/api/auth', authRoutes);

// Admin (protected routes)
app.use('/api/admin', adminRoutes);

// Officers
app.use('/api/officer', officersRoutes);

// Locations
app.use('/api/locations', locationsRoutes);

// Tickets
app.use('/api/tickets', ticketsRoutes);

// Audit logs
app.use('/api/audit', auditRoutes);

// Feedback
app.use('/api/feedback', feedbackRoutes);

// Categories
app.use('/api/categories', categoryRoutes);

// 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global error handler
app.use(errorMiddleware);

module.exports = app;
