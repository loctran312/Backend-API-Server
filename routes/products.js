const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const {
	upload,
	uploadAny,
	uploadMultiple,
	listProducts,
	getProductById,
	createProduct,
	updateProduct,
	deleteProduct
} = require('../controllers/productController');

function requireAdmin(req, res, next) {
	if (!req.user || req.user.role !== 'admin') {
		return res.status(403).json({ status: 'error', message: 'Forbidden' });
	}
	next();
}

router.get('/', listProducts);
router.get('/:id', getProductById);
// Sử dụng any() để chấp nhận tất cả fieldname (bao gồm variantImages_0_0, variantImages_0_1, ...)
router.post('/', verifyToken, requireAdmin, uploadAny.any(), createProduct);

router.put('/:id', verifyToken, requireAdmin, uploadAny.any(), updateProduct);
router.delete('/:id', verifyToken, requireAdmin, deleteProduct);

module.exports = router;

