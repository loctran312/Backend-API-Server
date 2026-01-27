const pool = require('../config/database');

// Hàm kiểm tra quyền admin
function isAdmin(req) {
	return req.user && req.user.role === 'admin';
}

// LẤY THỐNG KÊ CHO DASHBOARD (GET /dashboard/stats)
async function getDashboardStats(req, res) {
    try {

        
        if (!isAdmin(req)) {
            console.error('Không có quyền admin. Role:', req.user?.role);
            return res.status(403).json({ 
                status: 'error', 
                message: 'Không có quyền truy cập' 
            });
        }

        // Lấy date từ query params, nếu không có thì dùng hôm nay
        
        const dateStr = req.query.date || new Date().toISOString().split('T')[0];
        
        const targetDate = new Date(dateStr);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        // Query ngày hôm qua
        const prevDate = new Date(targetDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toISOString().split('T')[0];

        // 1. Đếm tổng đơn hàng, theo trạng thái
        const [orderStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN trang_thai = 'hoan_thanh' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN trang_thai = 'da_huy' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN trang_thai = 'dang_xu_ly' THEN 1 ELSE 0 END) as processing,
                SUM(CASE WHEN trang_thai = 'dang_giao' THEN 1 ELSE 0 END) as shipping,
                SUM(CASE WHEN trang_thai = 'cho_xu_ly' THEN 1 ELSE 0 END) as pending
            FROM don_hang
            WHERE DATE(ngay_dat_hang) = ?`,
            [dateStr]
        );

        // 2. Đếm tổng khách hàng (những người đã tạo account)
        const [customerStats] = await pool.execute(
            `SELECT COUNT(*) as total, 
                    SUM(CASE WHEN is_online = TRUE THEN 1 ELSE 0 END) as online
            FROM nguoi_dung
            WHERE vai_tro = 'khach_hang'`
        );

        // 3. Doanh thu hôm nay
                const [todayRevenue] = await pool.execute(
                        `SELECT COALESCE(SUM(dh.tong_tien), 0) as revenue
                        FROM don_hang dh
                        JOIN thanh_toan tt ON tt.ma_don_hang = dh.ma_don_hang
                        WHERE DATE(dh.ngay_dat_hang) = ?
                            AND dh.trang_thai IN ('hoan_thanh', 'dang_giao')
                            AND tt.trang_thai_thanh_toan = 'da_thanh_toan'`,
                        [dateStr]
                );

        // 4. Doanh thu hôm qua
        const [yesterdayRevenue] = await pool.execute(
                        `SELECT COALESCE(SUM(dh.tong_tien), 0) as revenue
                        FROM don_hang dh
                        JOIN thanh_toan tt ON tt.ma_don_hang = dh.ma_don_hang
                        WHERE DATE(dh.ngay_dat_hang) = ?
                            AND dh.trang_thai IN ('hoan_thanh', 'dang_giao')
                            AND tt.trang_thai_thanh_toan = 'da_thanh_toan'`,
                        [prevDateStr]
                );

        // 5. Top 3 sản phẩm bán chạy
        const [topProducts] = await pool.execute(
            `SELECT 
                sp.ma_san_pham as id,
                sp.ten_san_pham as name,
                SUM(ctdh.so_luong) as sales,
                SUM(ctdh.so_luong * ctdh.gia) as revenue
            FROM chi_tiet_don_hang ctdh
            JOIN san_pham sp ON sp.ma_san_pham = ctdh.ma_san_pham
            JOIN don_hang dh ON dh.ma_don_hang = ctdh.ma_don_hang
            JOIN thanh_toan tt ON tt.ma_don_hang = dh.ma_don_hang
            WHERE DATE(dh.ngay_dat_hang) = ?
              AND dh.trang_thai IN ('hoan_thanh', 'dang_giao')
              AND tt.trang_thai_thanh_toan = 'da_thanh_toan'
            GROUP BY sp.ma_san_pham, sp.ten_san_pham
            ORDER BY sales DESC
            LIMIT 3`,
            [dateStr]
        );

        // 6. Doanh thu theo giờ (24 giờ)
        const currentHour = new Date().getHours();
        const [hourlyRevenue] = await pool.execute(
            `SELECT 
                HOUR(dh.ngay_dat_hang) as hour,
                COALESCE(SUM(dh.tong_tien), 0) as revenue
            FROM don_hang dh
            JOIN thanh_toan tt ON tt.ma_don_hang = dh.ma_don_hang
            WHERE DATE(dh.ngay_dat_hang) = ?
              AND dh.trang_thai IN ('hoan_thanh', 'dang_giao')
              AND tt.trang_thai_thanh_toan = 'da_thanh_toan'
            GROUP BY HOUR(dh.ngay_dat_hang)
            ORDER BY hour ASC`,
            [dateStr]
        );


        // Ghép đủ 24 giờ (các giờ sau giờ hiện tại = 0)
        const hourlyData = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0 }));
        hourlyRevenue.forEach(row => {
            const h = Number(row.hour);
            if (h <= currentHour) {
                hourlyData[h] = { hour: h, revenue: Number(row.revenue) };
            }
        });

        // 7. 5 đơn gần nhất (theo ngày được chọn)
        const [recentOrders] = await pool.execute(
            `SELECT 
                dh.ma_don_hang as id,
                nd.ho_ten as customer,
                dh.tong_tien as amount,
                dh.trang_thai as status,
                dh.ngay_dat_hang as date
            FROM don_hang dh
            JOIN nguoi_dung nd ON nd.ma_nguoi_dung = dh.ma_nguoi_dung
            WHERE DATE(dh.ngay_dat_hang) = ?
            ORDER BY dh.ngay_dat_hang DESC
            LIMIT 5`,
            [dateStr]
        );

        // Map trạng thái tiếng Việt
        const statusMap = {
            'hoan_thanh': 'Hoàn tất',
            'cho_xu_ly': 'Chờ xác nhận',
            'dang_xu_ly': 'Đang xử lý',
            'dang_giao': 'Đang vận chuyển',
            'da_huy': 'Đã hủy'
        };

        const recentOrdersFormatted = recentOrders.map(order => {
            // Format date thành dd/mm/yyyy
            const orderDate = new Date(order.date);
            const day = String(orderDate.getDate()).padStart(2, '0');
            const month = String(orderDate.getMonth() + 1).padStart(2, '0');
            const year = orderDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            
            return {
                id: order.id,
                customer: order.customer,
                amount: Number(order.amount),
                status: order.status,
                date: formattedDate
            };
        });

        // Tính phần trăm thay đổi doanh thu
        const toNumberOrZero = (value) => {
            const num = Number(value);
            return Number.isFinite(num) ? num : 0;
        };
        const calcPercentChange = (today, yesterday) => {
            const a = toNumberOrZero(today);
            const b = toNumberOrZero(yesterday);
            if (b <= 0) return 0;
            const pct = ((a - b) / b) * 100;
            return Number.isFinite(pct) ? pct : 0;
        };
        const todayRev = toNumberOrZero(todayRevenue[0]?.revenue);
        const yesterdayRev = toNumberOrZero(yesterdayRevenue[0]?.revenue);
        const percentChange = calcPercentChange(todayRev, yesterdayRev);

        // Trả về dữ liệu 
        const responseData = {
            status: 'success',
            data: {
                totalOrders: orderStats[0]?.total || 0,
                completedOrders: orderStats[0]?.completed || 0,
                cancelledOrders: orderStats[0]?.cancelled || 0,
                processingOrders: orderStats[0]?.processing || 0,
                shippingOrders: orderStats[0]?.shipping || 0,
                pendingOrders: orderStats[0]?.pending || 0,
                totalCustomers: customerStats[0]?.total || 0,
                onlineCustomers: customerStats[0]?.online || 0,
                todayRevenue: todayRev,
                yesterdayRevenue: yesterdayRev,
                revenueChange: percentChange,
                topProducts: topProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    sales: Number(p.sales || 0),
                    revenue: Number(p.revenue || 0)
                })),
                hourlyRevenue: hourlyData,
                recentOrders: recentOrdersFormatted
            }
        };
        
        res.json(responseData);

    } catch (err) {
        console.error('getDashboardStats error:', err);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Không thể tải thống kê' 
        });
    }
}

module.exports = {
    getDashboardStats
};