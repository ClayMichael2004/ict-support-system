const pool = require('../config/db');

const logAction = async ({ userId, action, entity, entityId }) => {
  await pool.query(
    'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)',
    [userId, action, entity, entityId]
  );
};

const getAuditLogs = async () => {
  const [rows] = await pool.query(
    `SELECT al.id, u.full_name AS user, al.action, al.entity, al.entity_id, al.created_at
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
