const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { verifyToken } = require('../controllers/authController');

// API đặt hàng (Bắt buộc đăng nhập)
router.post('/create', verifyToken, orderController.createOrder);

// API lấy danh sách đơn hàng - Admin
router.get('/all', verifyToken, orderController.getAllOrders);

// API lấy danh sách đơn hàng - User
router.get('/user-orders', verifyToken, orderController.getUserOrders);

// API lấy thông tin đơn hàng
router.get('/:orderId', verifyToken, orderController.getOrderDetail);

// API cập nhật trạng thái đơn hàng (Admin)
router.put('/:orderId/status', verifyToken, orderController.updateOrderStatus);

// API hủy đơn hàng (User)
router.put('/:orderId/cancel', verifyToken, orderController.cancelOrder);

module.exports = router;
