const axios = require("axios");
const crypto = require("crypto");

exports.createPayment = async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        
        // Validate
        if (!amount || !orderId) {
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu amount hoặc orderId'
            });
        }
        
        const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
        const accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
        const secretkey = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";

        const requestId = partnerCode + Date.now();
        const momoOrderId = requestId; // MoMo orderId tạm
        const orderInfo = "Thanh toán MoMo UAT";

        const redirectUrl = process.env.MOMO_REDIRECT_URL || "http://localhost:5500/ShopLen/index.html";

        const ipnUrl = process.env.MOMO_IPN_URL || "http://localhost:3000/api/payment/momo/ipn";

        const requestType = "captureWallet";
        const extraData = orderId; // Lưu orderId thật vào extraData

        const rawSignature =
            `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
            `&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}` +
            `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
            `&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto.createHmac("sha256", secretkey)
            .update(rawSignature)
            .digest("hex");

        const requestBody = {
            partnerCode,
            accessKey,
            requestId,
            amount,
            orderId: momoOrderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            signature,
            lang: "en"
        };

        const momoResponse = await axios.post(
            "https://test-payment.momo.vn/v2/gateway/api/create",
            requestBody,
            { headers: { "Content-Type": "application/json" } }
        );

        // Lưu mapping momoOrderId -> realOrderId vào ma_tham_chieu
        if (momoResponse.data.resultCode === 0) {
            const db = require("../config/database");
            await db.query(
                `UPDATE thanh_toan 
                 SET ma_tham_chieu = ?
                 WHERE ma_don_hang = ?`,
                [momoResponse.data.orderId, orderId] // momoOrderId -> realOrderId
            );
        }

        return res.status(200).json({
            payUrl: momoResponse.data.payUrl,
            momo: momoResponse.data
        });

    } catch (error) {
        return res.status(500).json({
            message: "Thanh toán MoMo thất bại",
            error: error.response?.data || error.message
        });
    }
};

exports.ipnMomo = async (req, res) => {
    // Chuẩn MoMo nên trả 204
    return res.status(204).end();
};

exports.handleMomoCallback = async (req, res) => {
    try {
        const db = require("../config/database");
        
        const {
            orderId,
            resultCode,
            transId,
            message
        } = req.query;

        // Validate
        if (!orderId) {
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu orderId'
            });
        }

        // Tìm realOrderId bằng cách query ma_tham_chieu
        const [rows] = await db.query(
            `SELECT ma_don_hang FROM thanh_toan WHERE ma_tham_chieu = ?`,
            [orderId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy đơn hàng'
            });
        }

        const realOrderId = rows[0].ma_don_hang;

        // resultCode = 0 là thành công
        if (resultCode === '0') {
            
            // UPDATE trạng thái thanh toán
            const [result] = await db.query(
                `UPDATE thanh_toan 
                 SET trang_thai_thanh_toan = 'da_thanh_toan',
                     ma_tham_chieu = ?
                 WHERE ma_don_hang = ?`,
                [orderId || transId, realOrderId]
            );
            
            return res.json({
                status: 'success',
                message: 'Thanh toán thành công',
                orderId: realOrderId
            });
        } else {
            // Thất bại
            
            // Update trạng thái thất bại
            await db.query(
                `DELETE FROM thanh_toan 
                WHERE ma_don_hang = ?`,
                [realOrderId]
            );

            // Xóa chi tiết đơn hàng
            await db.query(
                `DELETE FROM chi_tiet_don_hang 
                WHERE ma_don_hang = ?`,
                [realOrderId]
            );

            // Xóa đơn hàng
            await db.query(
                `DELETE FROM don_hang 
                WHERE ma_don_hang = ?`,
                [realOrderId]
            );
            
            return res.json({
                status: 'failed',
                message: `Thanh toán thất bại: ${message}`,
                resultCode: resultCode
            });
        }

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi xử lý thanh toán'
        });
    }
};

exports.prepareMomoPayment = async (req, res) => {
    try {
        // Nhận thông tin từ frontend
        const { 
            userId,
            items,           // Giỏ hàng
            total,           // Tổng tiền
            customerInfo,    // Thông tin giao hàng
            note 
        } = req.body;

        // Validate
        if (!userId || !items || !total || !customerInfo) {
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu thông tin đơn hàng'
            });
        }

        // Tạo orderId TẠM (để MoMo biết, nhưng chưa insert DB)
        const date = new Date();
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const timestamp = Date.now();
        
        // Format: MOMO-DDMMYYYY-TIMESTAMP
        const tempOrderId = `MOMO-${d}${m}${y}-${timestamp}`;

        // Lưu thông tin đơn hàng vào extraData (để IPN lấy)
        const orderData = {
            userId,
            items,
            total,
            customerInfo,
            note,
            tempOrderId
        };
        
        // Encode thành base64 để gửi qua MoMo
        const extraData = Buffer.from(JSON.stringify(orderData)).toString('base64');

        // MoMo config
        const partnerCode = "MOMO";
        const accessKey = "F8BBA842ECF85";
        const secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";

        const requestId = partnerCode + Date.now();
        const orderId = tempOrderId;  // Dùng tempOrderId
        const orderInfo = `Thanh toan don hang ${tempOrderId}`;
        
        const redirectUrl = "http://localhost:5500/ShopLen/index.html?payment=momo";
        const ipnUrl = "http://localhost:3000/api/payment/momo/ipn";
        
        const requestType = "captureWallet";

        // Tạo signature
        const rawSignature =
            `accessKey=${accessKey}&amount=${total}&extraData=${extraData}` +
            `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}` +
            `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
            `&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto.createHmac("sha256", secretkey)
            .update(rawSignature)
            .digest("hex");

        const requestBody = {
            partnerCode,
            accessKey,
            requestId,
            amount: String(total),
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            signature,
            lang: "vi"
        };

        // Gọi MoMo API
        const momoResponse = await axios.post(
            "https://test-payment.momo.vn/v2/gateway/api/create",
            requestBody,
            { headers: { "Content-Type": "application/json" } }
        );

        // Trả payUrl cho frontend
        return res.status(200).json({
            status: 'success',
            payUrl: momoResponse.data.payUrl,
            tempOrderId: tempOrderId
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: "Lỗi khi tạo link thanh toán MoMo",
            error: error.response?.data || error.message
        });
    }
};
