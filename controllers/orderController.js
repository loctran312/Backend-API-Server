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

            await connection.query(
                `UPDATE ton_kho
                SET so_luong_ton = so_luong_ton - ?
                WHERE ma_bien_the = ? AND so_luong_ton >= ?`,
                [
                    item.quantity,
                    item.variantId,
                    item.quantity
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

// Lấy danh sách đơn hàng của người dùng
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.userId; // Lấy ID từ token
        const [rows] = await db.query(
            `SELECT ma_don_hang, ngay_dat_hang, tong_tien, trang_thai 
             FROM don_hang 
             WHERE ma_nguoi_dung = ? 
             ORDER BY ngay_dat_hang DESC`,
            [userId]
        );
        res.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: "Lỗi lấy danh sách đơn hàng"
        });
    }
}

// Lấy chi tiết đơn hàng
exports.getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;

        // Lấy thông tin đơn hàng
        const [orders] = await db.query(
            `SELECT d.*, tt.trang_thai_thanh_toan, u.ho_ten, u.email, u.so_dien_thoai
             FROM don_hang d
             LEFT JOIN thanh_toan tt ON d.ma_don_hang = tt.ma_don_hang
             LEFT JOIN nguoi_dung u ON d.ma_nguoi_dung = u.ma_nguoi_dung
             WHERE d.ma_don_hang = ? AND d.ma_nguoi_dung = ?`,
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn hàng' });
        }

        const order = orders[0];

        // Lấy danh sách sản phẩm trong đơn
        const [items] = await db.query(
            `SELECT c.*, s.ten_san_pham, s.hinh_anh_url, b.mau_sac, b.kich_co, b.url_hinh_anh_bien_the 
             FROM chi_tiet_don_hang c
             JOIN san_pham s ON c.ma_san_pham = s.ma_san_pham
             LEFT JOIN bien_the_san_pham b ON c.ma_bien_the = b.ma_bien_the
             WHERE c.ma_don_hang = ?`,
            [orderId]
        );

        res.json({
            status: 'success',
            data: {
                order: order,
                items: items
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Lỗi lấy chi tiết đơn hàng' 
        });
    }
}