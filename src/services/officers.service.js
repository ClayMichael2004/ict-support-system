const pool = require('../config/db');

/**
 * Get all active officers
 */
exports.getAllOfficers = async () => {
  const [rows] = await pool.query(
    'SELECT id, full_name AS fullName, email FROM users WHERE role_id = 2 AND is_active = 1'
  );
  return rows;
};

/**
 * Create officer (ADMIN)
 */
exports.createOfficer = async ({ fullName, email, password }) => {
  const [result] = await pool.query(
    `INSERT INTO users (full_name, email, password, role_id, is_active)
     VALUES (?, ?, ?, 2, 1)`,
    [fullName, email, password]
  );

  return result.insertId;
};

/**
 * Create staff (OFFICER)
 * role_id = 3 → STAFF
 */
exports.createStaff = async ({ fullName, email, password }) => {
  const STAFF_ROLE_ID = 3;

  const [result] = await pool.query(
    `INSERT INTO users (full_name, email, password, role_id, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [fullName, email, password, STAFF_ROLE_ID]
  );

  return result.insertId;
};

exports.getAllStaff = async () => {
  const [rows] = await pool.query(
    `SELECT 
       id,
       full_name AS fullName,
       email,
       created_at
     FROM users
     WHERE role_id = 3 AND is_active = 1`
  );
  return rows;
};
