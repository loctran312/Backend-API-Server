const axios = require("axios");
const crypto = require("crypto");

exports.createPayment = async (req, res) => {
    try {
        const amount = req.body.amount || "1000"; // default 1000 VND
        const partnerCode = "MOMO";
        const accessKey = "F8BBA842ECF85";
        const secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";

        const requestId = partnerCode + Date.now();
        const orderId = requestId;
        const orderInfo = "Demo thanh toán MoMo UAT";

        const redirectUrl = "http://localhost:5500/store%20wool/success.html";

        const ipnUrl = "http://localhost:3000/api/payment/momo/ipn";

        const requestType = "captureWallet";
        const extraData = "";

        const rawSignature =
            `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
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
            amount,
            orderId,
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

        console.log("===== RESPONSE FROM MOMO =====");
        console.log(JSON.stringify(momoResponse.data, null, 2));
        console.log("================================");

        return res.status(200).json({
            payUrl: momoResponse.data.payUrl,
            momo: momoResponse.data
        });

    } catch (error) {
        console.error("MoMo Error:", error.response?.data || error.message);
        return res.status(500).json({
            message: "Thanh toán MoMo thất bại",
            error: error.response?.data || error.message
        });
    }
};

// ================= IPN =================
exports.ipnMomo = async (req, res) => {
    console.log("📩 ====== IPN TỪ MOMO ======");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("================================");

    // Chuẩn MoMo nên trả 204
    return res.status(204).end();
};
