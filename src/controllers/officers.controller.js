const officerService = require('../services/officers.service');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');

/**
 * ADMIN: Get all officers
 */
const getOfficers = asyncHandler(async (req, res) => {
  const officers = await officerService.getAllOfficers();
  res.json({ success: true, data: officers });
});

/**
 * ADMIN: Add officer
 */
const addOfficer = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    res.status(400);
    throw new Error('All fields are required');
  }

  const hashed = await bcrypt.hash(password, 12);

  await officerService.createOfficer({
    fullName,
    email,
    password: hashed,
  });

  res.status(201).json({
    success: true,
    message: 'Officer added successfully',
  });
});

/**
 * OFFICER: Register staff (users who can book tickets)
 */

const getStaff = asyncHandler(async (req, res) => {
  const staff = await officerService.getAllStaff();
  res.json({
    success: true,
    data: staff,
  });
});

const registerStaff = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    res.status(400);
    throw new Error('All fields are required');
  }

  const hashed = await bcrypt.hash(password, 12);

  /**
   * ROLE IDS (based on your system)
   * 1 = ADMIN
   * 2 = OFFICER
   * 3 = STAFF
   */
  await officerService.createStaff({
    fullName,
    email,
    password: hashed,
  });

  res.status(201).json({
    success: true,
    message: 'Staff registered successfully',
  });
});

module.exports = {
  getOfficers,
  addOfficer,
  registerStaff,
  getStaff,
};
