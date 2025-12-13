const pool = require('../config/database');

// Hàm kiểm tra quyền admin
function isAdmin(req) {
	return req.user && req.user.role === 'admin';
}

// Hàm chuyển đổi dữ liệu từ database sang format dễ dùng
function mapCategoryRow(row) {
	return {
		id: row.id,
		name: row.name,
		description: row.description || ''
	};
}

// LẤY DANH SÁCH TẤT CẢ DANH MỤC (GET /categories)
async function listCategories(req, res) {
	try {
		// Query SQL: SELECT từ bảng danh_muc
		const [rows] = await pool.execute(
			`SELECT ma_danh_muc AS id,
			        ten_danh_muc AS name,
			        mo_ta AS description
			 FROM danh_muc 
			 ORDER BY ma_danh_muc DESC`
		);
		
		// Trả về kết quả dạng JSON
		return res.json({ 
			status: 'success', 
			categories: rows.map(mapCategoryRow) 
		});
	} catch (err) {
		console.error('listCategories error:', err);
		return res.status(500).json({ 
			status: 'error', 
			message: 'Không thể tải danh mục' 
		});
	}
}

// LẤY 1 DANH MỤC THEO ID (GET /categories/:id)
async function getCategoryById(req, res) {
	try {
		const { id } = req.params; // Lấy id từ URL
		
		const [rows] = await pool.execute(
			`SELECT ma_danh_muc AS id,
			        ten_danh_muc AS name,
			        mo_ta AS description
			 FROM danh_muc 
			 WHERE ma_danh_muc = ?`,
			[id]
		);
		
		if (!rows.length) {
			return res.status(404).json({ 
				status: 'error', 
				message: 'Không tìm thấy danh mục' 
			});
		}
		
		return res.json({ 
			status: 'success', 
			category: mapCategoryRow(rows[0]) 
		});
	} catch (err) {
		console.error('getCategoryById error:', err);
		return res.status(500).json({ 
			status: 'error', 
			message: 'Không thể tải danh mục' 
		});
	}
}

// TẠO DANH MỤC MỚI (POST /categories) - CHỈ ADMIN
async function createCategory(req, res) {
	try {
		// Kiểm tra quyền admin
		if (!isAdmin(req)) {
			return res.status(403).json({ 
				status: 'error', 
				message: 'Forbidden' 
			});
		}

		const { name, description } = req.body;
		
		// Kiểm tra dữ liệu đầu vào
		if (!name || !name.trim()) {
			return res.status(400).json({ 
				status: 'error', 
				message: 'Tên danh mục là bắt buộc' 
			});
		}

		// INSERT vào database
		const [result] = await pool.execute(
			`INSERT INTO danh_muc (ten_danh_muc, mo_ta)
			 VALUES (?, ?)`,
			[name.trim(), description || '']
		);

		// Trả về id của danh mục vừa tạo
		return res.status(201).json({ 
			status: 'success', 
			id: result.insertId,
			message: 'Tạo danh mục thành công'
		});
	} catch (err) {
		console.error('createCategory error:', err);
		return res.status(500).json({ 
			status: 'error', 
			message: 'Không thể tạo danh mục' 
		});
	}
}

// CẬP NHẬT DANH MỤC (PUT /categories/:id) - CHỈ ADMIN
async function updateCategory(req, res) {
	try {
		if (!isAdmin(req)) {
			return res.status(403).json({ 
				status: 'error', 
				message: 'Forbidden' 
			});
		}

		const { id } = req.params;
		const { name, description } = req.body;

		// Kiểm tra danh mục có tồn tại không
		const [rows] = await pool.execute(
			'SELECT * FROM danh_muc WHERE ma_danh_muc = ?',
			[id]
		);
		
		if (!rows.length) {
			return res.status(404).json({ 
				status: 'error', 
				message: 'Không tìm thấy danh mục' 
			});
		}

		// Kiểm tra dữ liệu đầu vào
		if (name !== undefined && !name.trim()) {
			return res.status(400).json({ 
				status: 'error', 
				message: 'Tên danh mục không được để trống' 
			});
		}

		// UPDATE database
		await pool.execute(
			`UPDATE danh_muc SET
			 ten_danh_muc = COALESCE(?, ten_danh_muc),
			 mo_ta = COALESCE(?, mo_ta)
			 WHERE ma_danh_muc = ?`,
			[
				typeof name !== 'undefined' ? name.trim() : null,
				typeof description !== 'undefined' ? description : null,
				id
			]
		);

		return res.json({ 
			status: 'success', 
			message: 'Cập nhật danh mục thành công' 
		});
	} catch (err) {
		console.error('updateCategory error:', err);
		return res.status(500).json({ 
			status: 'error', 
			message: 'Không thể cập nhật danh mục' 
		});
	}
}

// XÓA DANH MỤC (DELETE /categories/:id) - CHỈ ADMIN
async function deleteCategory(req, res) {
	try {
		if (!isAdmin(req)) {
			return res.status(403).json({ 
				status: 'error', 
				message: 'Forbidden' 
			});
		}

		const { id } = req.params;

		// Kiểm tra danh mục có tồn tại không
		const [rows] = await pool.execute(
			'SELECT * FROM danh_muc WHERE ma_danh_muc = ?',
			[id]
		);
		
		if (!rows.length) {
			return res.status(404).json({ 
				status: 'error', 
				message: 'Không tìm thấy danh mục' 
			});
		}

		// Kiểm tra xem có sản phẩm nào đang dùng danh mục này không
		const [products] = await pool.execute(
			'SELECT COUNT(*) AS count FROM san_pham WHERE ma_danh_muc = ?',
			[id]
		);
		
		if (products[0].count > 0) {
			return res.status(400).json({ 
				status: 'error', 
				message: 'Không thể xóa danh mục vì còn sản phẩm đang sử dụng' 
			});
		}

		// DELETE từ database
		await pool.execute('DELETE FROM danh_muc WHERE ma_danh_muc = ?', [id]);

		return res.json({ 
			status: 'success', 
			message: 'Đã xóa danh mục' 
		});
	} catch (err) {
		console.error('deleteCategory error:', err);
		return res.status(500).json({ 
			status: 'error', 
			message: 'Không thể xóa danh mục' 
		});
	}
}

module.exports = {
	listCategories,
	getCategoryById,
	createCategory,
	updateCategory,
	deleteCategory
};