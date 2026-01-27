const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { verifyToken } = require('../controllers/authController');

// GET /api/dashboard/stats - Lấy thống kê dashboard
router.get('/stats', verifyToken, getDashboardStats);

module.exports = router;
