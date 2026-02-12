const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

const roleMap = {
  1: 'ADMIN',
  2: 'OFFICER',
  3: 'STAFF'
};

const protect = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Authorization token missing');
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 🔥 FETCH USER FROM DB with full details
      const [rows] = await pool.query(
        'SELECT id, full_name, email, role_id, is_active FROM users WHERE id = ?',
        [decoded.id]
      );

      if (rows.length === 0 || !rows[0].is_active) {
        throw new ApiError(401, 'User not found or inactive');
      }

      const user = rows[0];
      const role = roleMap[user.role_id];

      req.user = {
        id: user.id,
        role,
        role_id: user.role_id,
        full_name: user.full_name,
        fullName: user.full_name,
        email: user.email,
      };

      // 🐛 DEBUG LOGGING
      console.log('🔐 Auth Debug:');
      console.log('  User ID:', req.user.id);
      console.log('  User Role:', req.user.role);
      console.log('  Allowed Roles:', allowedRoles);
      console.log('  Has Access?', allowedRoles.length === 0 || allowedRoles.includes(role));

      if (allowedRoles.length && !allowedRoles.includes(role)) {
        console.log('  ❌ ACCESS DENIED');
        throw new ApiError(403, 'Access forbidden');
      }

      console.log('  ✅ ACCESS GRANTED');
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token expired'));
      }
      if (err.name === 'JsonWebTokenError') {
        return next(new ApiError(401, 'Invalid token'));
      }
      next(err);
    }
  };
};

module.exports = { protect };
