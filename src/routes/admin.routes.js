const express = require('express');
const { protect } = require('../middlewares/auth.middleware');

const { getOfficers, addOfficer } = require('../controllers/officers.controller');
const { getLocations, createLocationController } = require('../controllers/locations.controller');

const router = express.Router();

router.use(protect(['ADMIN']));

router.get('/officers', getOfficers);
router.post('/officers', addOfficer);

router.get('/locations', getLocations);
router.post('/locations', createLocationController);

router.get('/tickets', (req, res) => {
  res.json({ success: true, message: 'Admin tickets endpoint' });
});

router.get('/audit', (req, res) => {
  res.json({ success: true, message: 'Admin audit endpoint' });
});

module.exports = router;
