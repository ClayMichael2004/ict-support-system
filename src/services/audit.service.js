const pool = require('../config/db');

const logAction = async ({ userId, action, entity, entityId }) => {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)',
      [userId || null, action, entity, entityId || null]
    );
  } catch (err) {
    console.error('Failed to log audit action:', err.message);
  }
};

const getAuditLogs = async () => {
  const [rows] = await pool.query(
    `SELECT 
       al.id, 
       u.full_name AS user, 
       u.full_name AS userName, 
       al.action, 
       al.entity, 
       al.entity_id AS entityId,
       al.entity_id, 
       al.created_at AS createdAt,
       al.created_at
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ORDER BY al.created_at DESC`
  );
  return rows;
};

module.exports = {
  logAction,
  getAuditLogs,
};
