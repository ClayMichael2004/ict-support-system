const pool = require('../config/db');

exports.getCategories = async () => {
  const [rows] = await pool.query(
    `SELECT id, name, description 
     FROM categories 
     WHERE is_active = 1
     ORDER BY id ASC`
  );
  return rows;
};
