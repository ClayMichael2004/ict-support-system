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
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
console.log('LOGIN HIT', req.body);

  res.status(200).json({
    status: 'success',
    data: {
      token,
      user,
    },
  });
});

module.exports = {
  login,
};
