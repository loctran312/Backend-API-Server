const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { verifyToken } = require('../controllers/authController');

// API đặt hàng (Bắt buộc đăng nhập)
router.post('/create', verifyToken, orderController.createOrder);

// API lấy danh sách đơn hàng - Admin
router.get('/all', verifyToken, orderController.getAllOrders);

module.exports = router;
