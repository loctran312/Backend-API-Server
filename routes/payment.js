const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Tạo đơn MoMo
router.post("/momo", paymentController.createPayment);

// Xử lý callback từ MoMo (Redirect URL)
router.get("/momo/callback", paymentController.handleMomoCallback);

// Nhận IPN từ MoMo
router.post("/momo/ipn", paymentController.ipnMomo);

module.exports = router;
