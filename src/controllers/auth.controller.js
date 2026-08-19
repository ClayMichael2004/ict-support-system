const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { loginUser } = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: 'fail',
      message: 'Email and password are required',
    });
    return;
  }

  const user = await loginUser(email, password);

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

  const isProduction = process.env.NODE_ENV === 'production';

  // Set secure httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/'
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

module.exports = {
  login,
  logout,
  getMe,
};
