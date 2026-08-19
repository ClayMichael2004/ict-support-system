const ApiError = require('../utils/ApiError');

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  let message = err.message || 'Internal Server Error';

  if (!err.statusCode && !err.isOperational) {
    console.error('SERVER ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
