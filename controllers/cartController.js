const db = require('../config/database');

exports.addToCart = async (req, res) => {
    // Nhận dữ liệu từ frontend
    const { ma_bien_the, so_luong } = req.body;
    const userId = req.user.userId; // Lấy id từ token đăng nhập

    // Kiểm tra đầu vào
    if (!ma_bien_the) {
        return res.status(400).json({ error: 'Không có sản phẩm trong giỏ hàng'});
    }

    try {
        // Kiểm tra sản phẩm đã nằm trong giỏ hàng của user
        const checkSql = `
            SELECT * FROM gio_hang 
            WHERE ma_nguoi_dung = ? AND ma_bien_the = ?
        `;

        const [results] = await db.query(checkSql, [userId, ma_bien_the]);

        if (results.length > 0) {
            // Nếu sản phẩm đã có trong giỏ hàng thì cập nhật số lượng
            const item = results[0];
            const newQuantity = item.so_luong + so_luong;

            const updateSql = `
                UPDATE gio_hang
                SET so_luong = ?
                WHERE ma_gio_hang = ?
            `;

            await db.query(updateSql, [newQuantity, item.ma_gio_hang]);
            return res.json({ status: 'success', message: 'Cập nhật số lượng sản phẩm thành công'});
        } else {
            // Nếu sản phẩm chưa có trong giỏ hàng thì thêm vào
            const insertSql = `
                INSERT INTO gio_hang (ma_nguoi_dung, ma_san_pham, ma_bien_the, so_luong)
                SELECT ?, ma_san_pham, ?, ? FROM bien_the_san_pham WHERE ma_bien_the = ?
            `;
            
            const [result] = await db.query(insertSql, [userId, ma_bien_the, so_luong, ma_bien_the]);

            if (result.affectedRows === 0) {
                return res.status(400).json({ error: "Không tìm thấy biến thể (ma_bien_the=" + ma_bien_the + ") để thêm vào giỏ. Dữ liệu sản phẩm có thể bị lỗi." });
            }
            
            return res.json({ status: 'success', message: 'Đã thêm mới vào giỏ' });
        }
    } catch (err) {
        return res.status(500).json({ error: "Lỗi Database: " + err.message });
    }
}

exports.getCart = async (req, res) => {
    const userId = req.user.userId;

    const sql = `
        SELECT 
            gh.so_luong, 
            gh.ma_bien_the,
            bt.mau_sac, 
            bt.kich_co, 
            bt.gia_them, 
            bt.url_hinh_anh_bien_the,
            sp.ma_san_pham, 
            sp.ten_san_pham, 
            sp.gia AS gia_goc, 
            sp.hinh_anh_url
        FROM gio_hang gh
        JOIN bien_the_san_pham bt ON gh.ma_bien_the = bt.ma_bien_the
        JOIN san_pham sp ON bt.ma_san_pham = sp.ma_san_pham
        WHERE gh.ma_nguoi_dung = ?
    `;

    try {
        const [results] = await db.query(sql, [userId]);
        const cartItems = results.map(item => {
            let finalPrice = Number(item.gia_goc);
            if (item.gia_them > 0) {
                finalPrice = item.gia_them;
            }
            
            let finalImage = item.url_hinh_anh_bien_the;

            return {
                ma_san_pham: item.ma_san_pham,
                ma_bien_the: item.ma_bien_the,
                name: item.ten_san_pham,
                price: finalPrice,
                image: finalImage,
                quantity: item.so_luong,
                mau_sac: item.mau_sac,
                kich_co: item.kich_co
            };
        
        });
        res.json({ status: 'success', cart: cartItems });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.mergeCart = async (req, res) => {
    const userId = req.user.userId;
    const { cartItems } = req.body; // cartItems là mảng []
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.json({ status: 'success', message: 'Nothing to merge' });
    }
    // Dùng Promise.all để chờ tất cả các lệnh thêm DB chạy xong
    try {
        const promises = cartItems.map(item => {
            return new Promise((resolve, reject) => {
                const { ma_bien_the, so_luong } = item;
                
                const checkSql = `SELECT * FROM gio_hang WHERE ma_nguoi_dung = ? AND ma_bien_the = ?`;
                
                db.query(checkSql, [userId, ma_bien_the], (err, results) => {
                    if (err) return reject(err);
                    if (results.length > 0) {
                        // Sản phẩm đã có trong giỏ hàng thì tăng số lượng
                        const newQty = results[0].so_luong + Number(so_luong);
                        db.query('UPDATE gio_hang SET so_luong = ? WHERE ma_gio_hang = ?', [newQty, results[0].ma_gio_hang], (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    } else {
                        // Sản phẩm chưa có trong giỏ hàng thì thêm mới
                        const insertSql = `INSERT INTO gio_hang (ma_nguoi_dung, ma_bien_the, so_luong) VALUES (?, ?, ?)`;
                        db.query(insertSql, [userId, ma_bien_the, so_luong], (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    }
                });
            });
        });
        await Promise.all(promises);
        res.json({ status: 'success', message: 'Merged successfully' });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi gộp giỏ hàng" });
    }
};

exports.updateCartItem = async (req, res) => {
    const userId = req.user.userId;
    const { ma_bien_the, so_luong } = req.body; // so_luong mới

    if (!ma_bien_the || so_luong < 0) {
        return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
    }

    try {
        if (so_luong === 0) {
             // Nếu số lượng = 0 thì xóa
             await db.query('DELETE FROM gio_hang WHERE ma_nguoi_dung = ? AND ma_bien_the = ?', [userId, ma_bien_the]);
             return res.json({ status: 'success', message: 'Đã xóa sản phẩm khỏi giỏ' });
        } else {
             // Cập nhật số lượng
             const [result] = await db.query('UPDATE gio_hang SET so_luong = ? WHERE ma_nguoi_dung = ? AND ma_bien_the = ?', [so_luong, userId, ma_bien_the]);
             if (result.affectedRows === 0) {
                 return res.status(404).json({ error: "Sản phẩm không có trong giỏ hàng" });
             }
             return res.json({ status: 'success', message: 'Đã cập nhật số lượng' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeCartItem = async (req, res) => {
    const userId = req.user.userId;
    const { ma_bien_the } = req.body;

    try {
        await db.query('DELETE FROM gio_hang WHERE ma_nguoi_dung = ? AND ma_bien_the = ?', [userId, ma_bien_the]);
        res.json({ status: 'success', message: 'Đã xóa sản phẩm' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};