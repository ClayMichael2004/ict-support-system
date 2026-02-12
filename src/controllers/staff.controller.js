const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const registerStaff = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  const officerLocation = req.user.location_id;

  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, 'All fields are required');
  }

  const [exists] = await pool.query(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  if (exists.length) throw new ApiError(409, 'User already exists');

  const hashedPassword = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users 
     (full_name, email, password, role_id, location_id, is_active)
     VALUES (?, ?, ?, 3, ?, 1)`,
    [fullName, email, hashedPassword, officerLocation]
  );

  res.status(201).json({
    success: true,
    message: 'Staff registered successfully',
  });
});

module.exports = {
  registerStaff,
};
