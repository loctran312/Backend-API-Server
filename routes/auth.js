const express = require('express');
const router = express.Router();
const { register, login, logout, verifyToken, getProfile } = require('../controllers/authController');

// POST /api/auth/register - Đăng ký tài khoản mới
router.post('/register', register);

// POST /api/auth/login - Đăng nhập
router.post('/login', login);

// POST /api/auth/logout - Đăng xuất
router.post('/logout', verifyToken, logout);

// GET /api/auth/profile - Lấy thông tin người dùng
router.get('/me', verifyToken, getProfile);

module.exports = router;