const asyncHandler = require('../utils/asyncHandler');
const categoryService = require('../services/categories.service');

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories();
  res.json({ success: true, data: categories });
});
