const ApiError = require('../utils/ApiError');

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // unexpected errors
  if (!err.isOperational) {
    console.error('UNEXPECTED ERROR:', err);
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
