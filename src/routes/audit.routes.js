const express = require('express');
const { getAuditLogsController } = require('../controllers/audit.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Only ADMIN can view audit logs
router.get('/', protect(['ADMIN']), getAuditLogsController);

module.exports = router;
