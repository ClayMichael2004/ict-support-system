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
      let token = null;

      // 1. Check cookies first (httpOnly cookie)
      if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      } 
      // 2. Fallback to Authorization header
      else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        throw new ApiError(401, 'Authorization token missing');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // FETCH USER FROM DB with role name
      const [rows] = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.role_id, u.is_active, r.name AS role_name 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [decoded.id]
      );

      if (rows.length === 0 || !rows[0].is_active) {
        throw new ApiError(401, 'User not found or inactive');
      }

      const user = rows[0];
      const role = (user.role_name || roleMap[user.role_id] || decoded.role || '').toUpperCase();

      req.user = {
        id: user.id,
        role,
        role_id: user.role_id,
        full_name: user.full_name,
        fullName: user.full_name,
        email: user.email,
      };

      if (allowedRoles.length) {
        const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
        if (!normalizedAllowed.includes(role)) {
          throw new ApiError(403, 'Access forbidden');
        }
      }

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
