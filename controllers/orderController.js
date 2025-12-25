const db = require("../config/database");

// Tạo mã đơn hàng
async function generateOderId(cityId) {
    let cityCode = "VN";

    if (cityId) {
        cityCode = cityId.toUpperCase();
    }

    const date = new Date();
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const dateStr = `${d}${m}${y}`;

    const prefix = `${cityCode}-${dateStr}-`;
    const [rows] = await db.query(
        `SELECT ma_don_hang FROM don_hang 
        WHERE ma_don_hang LIKE ? 
        ORDER BY ma_don_hang DESC LIMIT 1`, 
        [`${prefix}%`]
    );

    let sequence = 1;
    if (rows.length > 0) {
        const lastId = rows[0].ma_don_hang;
        const lastSequence = parseInt(lastId.split('-')[2]);
        sequence = lastSequence + 1;
    }

    const sequenceStr = String(sequence).padStart(6, '0');
    return `${prefix}${sequenceStr}`;
}

exports.createOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { items, total, customerInfo , note, paymentMethod } = req.body;
        const userId = req.user.userId; // Lấy từ Token thật

        // Tạo mã đơn hàng
        const orderId = await generateOderId(customerInfo.cityId);

        // Insert bảng don_hang
        await connection.query(
            `INSERT INTO don_hang (
                ma_don_hang, 
                ma_nguoi_dung, 
                trang_thai, 
                tong_tien, 
                ghi_chu, 
                ma_thanhpho, 
                ma_phuong, 
                dia_chi_giao_hang, 
                ngay_dat_hang
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                orderId,
                userId,
                "cho_xu_ly",
                total,
                note,
                customerInfo.cityId,
                customerInfo.wardId,
                customerInfo.address
            ]
        );

        // Insert bảng chi_tiet_don_hang
        for (const item of items) {
            await connection.query(
                `INSERT INTO chi_tiet_don_hang (
                    ma_don_hang,
                    ma_san_pham,
                    ma_bien_the,
                    so_luong,
                    gia
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.productId,
                    item.variantId,
                    item.quantity,
                    item.price
                ]
            );
        }

        // Insert bảng thanh_toan
        let trangThaiThanhToan = "chua_thanh_toan"; // Mặc định cho COD
        if (paymentMethod === "cod") {
            trangThaiThanhToan = "chua_thanh_toan";
        }
        // ================================= MoMo tạm chưa làm

        await connection.query(
            `INSERT INTO thanh_toan (
                ma_don_hang,
                trang_thai_thanh_toan
            )
            VALUES (?, ?)`,
            [
                orderId,
                trangThaiThanhToan
            ]
        );

        // Xóa giỏ hàng
        await connection.query(
            'DELETE FROM gio_hang WHERE ma_nguoi_dung = ?', [userId]
        );

        await connection.commit();
        res.json({
            status: 'success',
            message: 'Đặt hàng thành công',
            orderId
        });
        
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({
            status: "error",
            message: "Lỗi server khi đặt hàng"
        });
    } finally {
        connection.release();
    }
};

// Lấy danh sách đơn hàng admin
exports.getAllOrders = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT d.*, u.ho_ten, u.so_dien_thoai, tt.trang_thai_thanh_toan 
             FROM don_hang d
             LEFT JOIN nguoi_dung u ON d.ma_nguoi_dung = u.ma_nguoi_dung
             LEFT JOIN thanh_toan tt ON d.ma_don_hang = tt.ma_don_hang
             ORDER BY d.ngay_dat_hang DESC`
        );
        res.json({
            status: 'success',
            data: rows
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Lỗi lấy danh sách đơn hàng"
        });
    }
}

// lay danh sach don hang cua nguoi dung
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.userId; // Lấy từ Token thật
        const [rows] = await db.query(
            `SELECT d.*, tt.trang_thai_thanh_toan 
             FROM don_hang d
             LEFT JOIN nguoi_dung u ON d.ma_nguoi_dung = u.ma_nguoi_dung
             LEFT JOIN thanh_toan tt ON d.ma_don_hang = tt.ma_don_hang
             WHERE d.ma_nguoi_dung = ?
             ORDER BY d.ngay_dat_hang DESC `,[userId]
        );
        res.json({
            status: 'success',
            data: rows
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Lỗi lấy danh sách đơn hàng của người dùng"
        });
    }
}

// lay chi tiet don hang 
exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const [rows] = await db.query(
            `SELECT ct.*, sp.ten_san_pham, bt.ten_bien_the 
             FROM chi_tiet_don_hang ct
             LEFT JOIN san_pham sp ON ct.ma_san_pham = sp.ma_san_pham
             LEFT JOIN bien_the bt ON ct.ma_bien_the = bt.ma_bien_the
             WHERE ct.ma_don_hang = ?`, [orderId]
        );
        res.json({
            status: 'success',
            data: rows
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Lỗi lấy chi tiết đơn hàng"
        });
    }
}
