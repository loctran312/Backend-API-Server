const express = require('express');
const router = express.Router();

const { verifyToken } = require('../controllers/authController');

function requireAdmin(req, res, next) {
	if (!req.user || req.user.role !== 'admin') {
		return res.status(403).json({ status: 'error', message: 'Forbidden' });
	}
	next();
}

// Import controller
const {
	listCategories,
	getCategoryById,
	createCategory,
	updateCategory,
	deleteCategory
} = require('../controllers/categoryController');

// Định nghĩa các routes
// GET
router.get('/', listCategories);

// GET :id
router.get('/:id', getCategoryById);

// POST
router.post('/', verifyToken, requireAdmin, createCategory);

// PUT :id
router.put('/:id', verifyToken, requireAdmin, updateCategory);

// DELETE :id
router.delete('/:id', verifyToken, requireAdmin, deleteCategory);

module.exports = router;
