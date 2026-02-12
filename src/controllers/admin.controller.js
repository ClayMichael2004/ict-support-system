const db = require('../config/db');
const ApiError = require('../utils/ApiError');
exports.getOfficers = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name AS fullName, email
       FROM users
       WHERE role_id = 2 AND is_active = 1`
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
};


const bcrypt = require('bcryptjs');

exports.addOfficer = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      throw new ApiError(400, 'All fields are required');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      `INSERT INTO users (full_name, email, password, role_id, is_active)
       VALUES (?, ?, ?, 2, 1)`,
      [fullName, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'Officer added successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.getLocations = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         l.id,
         l.name,
         l.building,
         u.full_name AS officerName
       FROM locations l
       JOIN users u ON l.officer_id = u.id
       WHERE l.is_active = 1`
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
};


exports.addLocation = async (req, res, next) => {
  try {
    const { name, building, officerId } = req.body;

    if (!name || !officerId) {
      throw new ApiError(400, 'Location name and officer are required');
    }

    // ensure officer exists and is active
    const [officer] = await db.query(
      `SELECT id FROM users WHERE id = ? AND role_id = 2 AND is_active = 1`,
      [officerId]
    );

    if (!officer.length) {
      throw new ApiError(404, 'Officer not found');
    }

    await db.query(
      `INSERT INTO locations (name, building, officer_id, is_active)
       VALUES (?, ?, ?, 1)`,
      [name, building || null, officerId]
    );

    res.status(201).json({
      success: true,
      message: 'Location added successfully',
    });
  } catch (err) {
    next(err);
  }
};
