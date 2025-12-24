const pool = require("../config/database");
// format don hang
function mapOrder(row) {
  return {
    orderId: row.ma_don_hang,
    orderDate: row.ngay_dat_hang,
    status: row.trang_thai,
    note: row.ghi_chu,
    address: row.dia_chi_giao_hang,
    customer: row.ma_nguoi_dung,
    items: [],
  };
}

// format chi tiet don hang
function mapDetailOrder(row) {
  return {
    detailOrderId: row.ma_chi_tiet,
    productId: row.ma_san_pham,
    variantId: row.ma_bien_the,
    quantity: row.so_luong,
    price: row.gia,
  };
}

// Lấy danh sách đơn hàng cùng chi tiết đơn hàng
async function getCheckoutList( req,res) {
  try {
    const SQL = `SELECT 
        dh.ma_don_hang,
        dh.ngay_dat_hang,
        dh.trang_thai,
        dh.ghi_chu,
        dh.dia_chi_giao_hang,
        dh.ma_nguoi_dung,

        ctdh.ma_chi_tiet,
        ctdh.ma_san_pham,
        ctdh.ma_bien_the,
        ctdh.so_luong,
        ctdh.gia
        FROM don_hang dh
        LEFT JOIN chi_tiet_don_hang ctdh 
        ON dh.ma_don_hang = ctdh.ma_don_hang
        ORDER BY dh.ma_don_hang DESC; 
        `;
    const [rows] = await pool.query(SQL);

    // Gom nhóm đơn hàng và chi tiết đơn hàng
    const orders = {};

    // Duyệt qua từng dòng kết quả
    rows.forEach((row) => {
      // Nếu đơn hàng chưa tồn tại trong đối tượng orders, tạo mới
      if (!orders[row.ma_don_hang]) {
        // Tạo đơn hàng mới
        orders[row.ma_don_hang] = mapOrder(row);
      }
      // Thêm chi tiết đơn hàng vào mảng items của đơn hàng tương ứng
      if (row.ma_chi_tiet) {
        // Chỉ thêm nếu có chi tiết đơn hàng
        orders[row.ma_don_hang].items.push(mapDetailOrder(row));
      }
    });
    // Trả về danh sách đơn hàng đã được gom nhóm
    res.json({
      status: "success",
      order: Object.values(orders), // Object.values(orders) chuyển đổi đối tượng orders thành mảng các đơn hàng
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
}

// tao ma don hang
async function generateOrderCode(ma_thanhpho,connection) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  // YYYYMMDD

  // Đếm số đơn trong ngày theo thành phố
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM don_hang
    WHERE ma_thanhpho = ?
    AND DATE(ngay_dat_hang) = CURDATE()
    `,
    [ma_thanhpho]
  );

  const sequence = String(rows[0].total + 1).padStart(6, "0");
  return `${ma_thanhpho}-${dateStr}-${sequence}`;
}

// insert don hang
async function insertOrder(req, res) {
  const connection = await pool.getConnection();
  try {
    // Bắt đầu  khoi tao giao dịch 
    await connection.beginTransaction();
    // Tạo mã đơn hàng
    const orderCode = await generateOrderCode(req.body.ma_thanhpho,connection);
    // Thêm đơn hàng vào bảng don_hang
    await connection.query(
      `
  INSERT INTO don_hang (
    ma_don_hang,
    ma_nguoi_dung,
    ngay_dat_hang,
    trang_thai,
    tong_tien,
    ghi_chu,
    ma_thanhpho,
    ma_phuong,
    dia_chi_giao_hang
  ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)
  `,
      [
        orderCode,
        req.body.ma_nguoi_dung,
        req.body.trang_thai || "cho_xu_ly",
        req.body.tong_tien,
        req.body.ghi_chu || null,
        req.body.ma_thanhpho,
        req.body.ma_phuong,
        req.body.dia_chi_giao_hang,
      ]
    );
    // khoi tao index so thu tu cua chi tiet don hang trong moi don hang
    let index = 1;
    // Thêm chi tiết đơn hàng vào bảng chi_tiet_don_hang
    for (const item of req.body.items) {
        // Tạo mã chi tiết đơn hàng
      const detailCode = `${orderCode}-${String(index).padStart(2, "0")}`;
        // Thêm chi tiết đơn hàng
      await connection.query(
        `
    INSERT INTO chi_tiet_don_hang (
      ma_chi_tiet,
      ma_don_hang,
      ma_san_pham,
      ma_bien_the,
      so_luong,
      gia
    ) VALUES (?, ?, ?, ?, ?, ?)
    `,
        [
          detailCode,
          orderCode,
          item.ma_san_pham,
          item.ma_bien_the,
          item.so_luong,
          item.gia,
        ]
      );
      // Tang index len 1 de tao ma chi tiet don hang tiep theo
      index++;
    }
    // Xác nhận giao dịch hoan tất
    await connection.commit();
    // Trả về phản hồi thành công
    res.status(201).json({ message: "Đơn hàng được tạo thành công", orderId: orderCode });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
}
