const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const pool = require('../config/db');

// Get all ticket categories
router.get('/', protect(), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description FROM ticket_categories WHERE is_active = 1'
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
