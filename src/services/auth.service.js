const bcrypt = require('bcrypt');
const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

const loginUser = async (email, password) => {
  // 1. Find user by email
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.password, u.is_active, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.email = ?`,
    [email]
  );

  if (rows.length === 0) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const user = rows[0];

  // 2. Check if account is active
  if (!user.is_active) {
    throw new ApiError(403, 'Account is disabled. Contact administrator');
  }

  // 3. Compare password
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // 4. Return safe user data (NO password)
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  };
};

module.exports = {
  loginUser,
};
