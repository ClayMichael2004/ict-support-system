const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { getCategories } = require('../controllers/categories.controller');

// Get all ticket categories
router.get('/', protect(), getCategories);

module.exports = router;
