const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Tạo đơn MoMo
router.post("/momo", paymentController.createPayment);

// Nhận IPN từ MoMo
router.post("/momo/ipn", paymentController.ipnMomo);

module.exports = router;
