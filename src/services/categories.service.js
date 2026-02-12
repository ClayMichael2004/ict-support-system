const pool = require('../config/db');

exports.getCategories = async () => {
  const [rows] = await pool.query(
    `SELECT id, name, description 
     FROM ticket_categories 
     WHERE is_active = 1`
  );
  return rows;
};
