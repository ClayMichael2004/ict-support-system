const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

const createLocation = async ({ name, building, officerId }) => {
  if (!name || !officerId) {
    throw new ApiError(400, 'Location name and officer ID are required');
  }

  // Verify officer exists and is active
  const [officerRows] = await pool.query(
    'SELECT id FROM users WHERE id = ? AND role_id = 2 AND is_active = 1',
    [officerId]
  );

  if (officerRows.length === 0) {
    throw new ApiError(404, 'Assigned officer not found or inactive');
  }

  // Insert location
  const [result] = await pool.query(
    `INSERT INTO locations (name, building, officer_id) VALUES (?, ?, ?)`,
    [name, building || null, officerId]
  );

  return {
    id: result.insertId,
    name,
    building: building || null,
    officerId,
    is_active: 1,
  };
};

module.exports = {
  createLocation,
};
