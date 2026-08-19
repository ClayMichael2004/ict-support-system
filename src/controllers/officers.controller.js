const officerService = require('../services/officers.service');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');

const ApiError = require('../utils/ApiError');
const { logAction } = require('../services/audit.service');

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
    throw new ApiError(400, 'All fields are required');
  }

  const hashed = await bcrypt.hash(password, 12);

  const officerId = await officerService.createOfficer({
    fullName,
    email,
    password: hashed,
  });

  try {
    await logAction({
      userId: req.user.id,
      action: 'CREATE_OFFICER',
      entity: 'USER',
      entityId: officerId,
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }

  res.status(201).json({
    success: true,
    message: 'Officer added successfully',
    data: { id: officerId, fullName, email },
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
    throw new ApiError(400, 'All fields are required');
  }

  const hashed = await bcrypt.hash(password, 12);

  const staffId = await officerService.createStaff({
    fullName,
    email,
    password: hashed,
  });

  try {
    await logAction({
      userId: req.user.id,
      action: 'REGISTER_STAFF',
      entity: 'USER',
      entityId: staffId,
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }

  res.status(201).json({
    success: true,
    message: 'Staff registered successfully',
    data: { id: staffId, fullName, email },
  });
});

module.exports = {
  getOfficers,
  addOfficer,
  registerStaff,
  getStaff,
};
