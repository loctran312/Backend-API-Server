const express = require('express');
const router = express.Router();
// import middleware xac thuc
const {verifyToken} = require('../controllers/authController');
const { listCategories,getCategoriesById,createCategories,updateCategories,deleteCategories }
= require('../controllers/categoryController');

function requireAdmin(req, res, next) {
	if (!req.user || req.user.role !== 'admin') {
		return res.status(403).json({ status: 'error', message: 'Forbidden' });
	}
	next();
}
router.get('/',listCategories);
router.get('/:id',getCategoriesById);
router.post('/', verifyToken,requireAdmin,createCategories);
router.put('/:id',verifyToken,requireAdmin,updateCategories);
router.delete('/:id',verifyToken,requireAdmin,deleteCategories);
module.exports = router;