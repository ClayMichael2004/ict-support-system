const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

const getLocations = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT l.id, l.name, l.building, u.full_name AS officerName
     FROM locations l
     LEFT JOIN users u ON l.officer_id = u.id
     WHERE l.is_active = 1`
  );

  res.json({ success: true, data: rows });
});

const createLocationController = asyncHandler(async (req, res) => {
  const { name, building, officerId } = req.body;
  if (!name || !officerId) throw new ApiError(400, 'Location name and officer are required');

  const [officer] = await pool.query(
    'SELECT id FROM users WHERE id = ? AND role_id = 2 AND is_active = 1',
    [officerId]
  );
  if (!officer.length) throw new ApiError(404, 'Officer not found');

  const [result] = await pool.query(
    'INSERT INTO locations (name, building, officer_id, is_active) VALUES (?, ?, ?, 1)',
    [name, building || null, officerId]
  );

  res.status(201).json({
    success: true,
    data: { id: result.insertId, name, building, officerId },
    message: 'Location added successfully',
  });
});

module.exports = {
  getLocations,
  createLocationController,
};
