const express = require('express');
const { protect } = require('../middlewares/auth.middleware');

const { getOfficers, addOfficer } = require('../controllers/officers.controller');
const { getLocations, createLocationController } = require('../controllers/locations.controller');
const { getTicketsController } = require('../controllers/tickets.controller');
const { getAuditLogsController } = require('../controllers/audit.controller');

const router = express.Router();

router.use(protect(['ADMIN']));

router.get('/officers', getOfficers);
router.post('/officers', addOfficer);

router.get('/locations', getLocations);
router.post('/locations', createLocationController);

router.get('/tickets', getTicketsController);

router.get('/audit', getAuditLogsController);

module.exports = router;
