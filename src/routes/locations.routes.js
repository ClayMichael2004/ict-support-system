const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { getLocations, createLocationController } = require('../controllers/locations.controller');

const router = express.Router();

// GET all locations — any logged-in user (staff or user)
router.get('/', protect(), getLocations);

// POST create location — only ADMIN
router.post('/', protect(['ADMIN']), createLocationController);

module.exports = router;
