const { getAuditLogs } = require('../services/audit.service');
const asyncHandler = require('../utils/asyncHandler');

const getAuditLogsController = asyncHandler(async (req, res) => {
  const logs = await getAuditLogs();

  res.status(200).json({
    status: 'success',
    results: logs.length,
    data: logs,
  });
});

module.exports = {
  getAuditLogsController,
};
