const pool = require('../config/database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer để lưu avatar
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadDir = path.join(__dirname, '../uploads/avatars');
		// Tạo thư mục nếu chưa tồn tại
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, 'avatar-' + req.user.userId + '-' + uniqueSuffix + path.extname(file.originalname));
	}
});

const fileFilter = (req, file, cb) => {
	// Chỉ chấp nhận file ảnh
	if (file.mimetype.startsWith('image/')) {
		cb(null, true);
	} else {
		cb(new Error('Chỉ chấp nhận file ảnh!'), false);
	}
};

const uploadAvatar = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
	}
});

function isAdmin(req) {
	return req.user && (req.user.role === 'admin');
}

function mapUserRow(row) {
	return {
		id: row.id,
		name: row.name || '',
		firstName: row.first_name || '',
		lastName: row.last_name || '',
		username: row.username || '',
		email: row.email || '',
		phone: row.phone || '',
		address: row.dia_chi || '',
		city: row.thanh_pho || '',
		role: row.role || 'khach_hang',
		avatarUrl: row.url_hinh_dai_dien || '',
		createdAt: row.createdAt
	};
}

// Lấy danh sách tài khoản
async function listUsers(req, res) {
	try {
		if (!isAdmin(req)) {
			return res.status(403).json({ status: 'error', message: 'Forbidden' });
		}
		const [rows] = await pool.execute(
			`SELECT ma_nguoi_dung AS id,
			        ho_ten AS name,
			        first_name,
			        last_name,
			        username,
			        email,
			        so_dien_thoai AS phone,
			        dia_chi,
			        thanh_pho,
			        vai_tro AS role,
			        thoi_gian_tao AS createdAt
			 FROM nguoi_dung ORDER BY ma_nguoi_dung DESC`
		);
		return res.json({ status: 'success', users: rows.map(mapUserRow) });
	} catch (err) {
		console.error('listUsers error:', err);
		return res.status(500).json({ status: 'error', message: 'Internal server error' });
	}
}

// Thêm tài khoản
async function createUser(req, res) {
	try {
		if (!isAdmin(req)) {
			return res.status(403).json({ status: 'error', message: 'Forbidden' });
		}
		const { name, username, email, password, phone, role } = req.body;
		if (!name || !username || !email || !password) {
			return res.status(400).json({ status: 'error', message: 'Thiếu thông tin bắt buộc' });
		}
		const [existsU] = await pool.execute('SELECT 1 FROM nguoi_dung WHERE username=?', [username.trim()]);
		if (existsU.length) return res.status(400).json({ status: 'error', message: 'Username đã tồn tại' });
		const [existsE] = await pool.execute('SELECT 1 FROM nguoi_dung WHERE email=?', [email.trim()]);
		if (existsE.length) return res.status(400).json({ status: 'error', message: 'Email đã tồn tại' });
		const hashed = await bcrypt.hash(password, 10);
		const [result] = await pool.execute(
			`INSERT INTO nguoi_dung (ho_ten, username, email, mat_khau, so_dien_thoai, vai_tro)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[name.trim(), username.trim(), email.trim(), hashed, phone ? phone.trim() : null, role || 'khach_hang']
		);
		return res.status(201).json({ status: 'success', id: result.insertId });
	} catch (err) {
		console.error('createUser error:', err);
		return res.status(500).json({ status: 'error', message: 'Internal server error' });
	}
}

// Cập nhật tài khoản
async function updateUser(req, res) {
	try {
		if (!isAdmin(req)) {
			return res.status(403).json({ status: 'error', message: 'Forbidden' });
		}
		const { id } = req.params;
		const { name, username, email, password, phone, role } = req.body;
		// Fetch existing
		const [rows] = await pool.execute('SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=?', [id]);
		if (!rows.length) return res.status(404).json({ status: 'error', message: 'User không tồn tại' });
		// Uniqueness checks if provided
		if (username) {
			const [existsU] = await pool.execute('SELECT 1 FROM nguoi_dung WHERE username=? AND ma_nguoi_dung<>?', [username.trim(), id]);
			if (existsU.length) return res.status(400).json({ status: 'error', message: 'Username đã tồn tại' });
		}
		if (email) {
			const [existsE] = await pool.execute('SELECT 1 FROM nguoi_dung WHERE email=? AND ma_nguoi_dung<>?', [email.trim(), id]);
			if (existsE.length) return res.status(400).json({ status: 'error', message: 'Email đã tồn tại' });
		}
		let hashed = undefined;
		if (password) hashed = await bcrypt.hash(password, 10);
		await pool.execute(
			`UPDATE nguoi_dung SET 
			 ho_ten = COALESCE(?, ho_ten),
			 username = COALESCE(?, username),
			 email = COALESCE(?, email),
			 mat_khau = COALESCE(?, mat_khau),
			 so_dien_thoai = COALESCE(?, so_dien_thoai),
			 vai_tro = COALESCE(?, vai_tro)
			WHERE ma_nguoi_dung = ?`,
			[
				name ? name.trim() : null,
				username ? username.trim() : null,
				email ? email.trim() : null,
				hashed || null,
				phone ? phone.trim() : null,
				role || null,
				id
			]
		);
		return res.json({ status: 'success' });
	} catch (err) {
		console.error('updateUser error:', err);
		return res.status(500).json({ status: 'error', message: 'Internal server error' });
	}
}

// Xóa tài khoản
async function deleteUser(req, res) {
	try {
		if (!isAdmin(req)) {
			return res.status(403).json({ status: 'error', message: 'Forbidden' });
		}
		const { id } = req.params;
		await pool.execute('DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?', [id]);
		return res.json({ status: 'success' });
	} catch (err) {
		console.error('deleteUser error:', err);
		return res.status(500).json({ status: 'error', message: 'Internal server error' });
	}
}

// Lấy thông tin tài khoản của chính người dùng (profile)
async function getCurrentUser(req, res) {
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

		const [rows] = await pool.execute(
			`SELECT ma_nguoi_dung AS id,
			        ho_ten AS name,
			        first_name,
			        last_name,
			        username,
			        email,
			        so_dien_thoai AS phone,
			        dia_chi,
			        thanh_pho,
			        vai_tro AS role,
			        url_hinh_dai_dien,
			        thoi_gian_tao AS createdAt
			 FROM nguoi_dung
			 WHERE ma_nguoi_dung = ?`,
			[userId]
		);
		if (!rows.length) return res.status(404).json({ status: 'error', message: 'User not found' });
		return res.json({ status: 'success', user: mapUserRow(rows[0]) });
	} catch (err) {
		console.error('getCurrentUser error:', err);
		return res.status(500).json({ status: 'error', message: 'Internal server error' });
	}
}

// Cập nhật thông tin cá nhân của chính người dùng
async function updateCurrentUser(req, res) {
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

		const { firstName, lastName, email, phone, address, city } = req.body;

		if (email) {
			const [exists] = await pool.execute(
				'SELECT 1 FROM nguoi_dung WHERE email = ? AND ma_nguoi_dung <> ?',
				[email.trim(), userId]
			);
			if (exists.length) {
				return res.status(400).json({ status: 'error', message: 'Email này đã được sử dụng' });
			}
		}

		const first = typeof firstName !== 'undefined' ? (firstName?.trim() || null) : null;
		const last = typeof lastName !== 'undefined' ? (lastName?.trim() || null) : null;
		const fullName = (first || last)
			? `${first || ''} ${last || ''}`.trim()
			: null;

		await pool.execute(
			`UPDATE nguoi_dung SET
			 first_name = COALESCE(?, first_name),
			 last_name = COALESCE(?, last_name),
			 ho_ten = COALESCE(?, ho_ten),
			 email = COALESCE(?, email),
			 so_dien_thoai = COALESCE(?, so_dien_thoai),
			 dia_chi = COALESCE(?, dia_chi),
			 thanh_pho = COALESCE(?, thanh_pho)
			 WHERE ma_nguoi_dung = ?`,
			[
				first,
				last,
				fullName,
				typeof email !== 'undefined' ? (email?.trim() || null) : null,
				typeof phone !== 'undefined' ? (phone?.trim() || null) : null,
				typeof address !== 'undefined' ? (address?.trim() || null) : null,
				typeof city !== 'undefined' ? (city?.trim() || null) : null,
				userId
			]
		);

		return res.json({ status: 'success', message: 'Cập nhật thông tin thành công' });
	} catch (err) {
		console.error('updateCurrentUser error:', err);
		return res.status(500).json({ status: 'error', message: 'Internal server error' });
	}
}

// Cập nhật mật khẩu người dùng hiện tại
async function updateUserPassword(req, res) {
	try {
		const userId = req.user?.userId;
		if (!userId) {
			return res.status(401).json({ status: 'error', message: 'Unauthorized' });
		}

		const { currentPassword, newPassword } = req.body || {};
		if (!currentPassword || !newPassword) {
			return res.status(400).json({ status: 'error', message: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' });
		}

		// Lấy mật khẩu hiện tại
		const [rows] = await pool.execute(
			'SELECT mat_khau FROM nguoi_dung WHERE ma_nguoi_dung = ?',
			[userId]
		);
		if (!rows.length) {
			return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
		}

		const match = await bcrypt.compare(currentPassword, rows[0].mat_khau);
		if (!match) {
			return res.status(400).json({ status: 'error', message: 'Mật khẩu hiện tại không đúng' });
		}

		const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
		const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

		await pool.execute(
			'UPDATE nguoi_dung SET mat_khau = ? WHERE ma_nguoi_dung = ?',
			[hashedPassword, userId]
		);

		return res.json({ status: 'success', message: 'Đổi mật khẩu thành công' });
	} catch (err) {
		console.error('updateUserPassword error:', err);
		return res.status(500).json({ status: 'error', message: 'Internal server error' });
	}
}

async function CountQuantityCart(req, res) 
{
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
		const [rows] = await pool.execute(
			`SELECT COUNT(ma_gio_hang) AS quantity
			 FROM gio_hang
			 WHERE ma_nguoi_dung = ?`,
			[userId]
		);
		const quantity = rows[0].quantity || 0;
		return res.json({ status: 'success', quantity });
	} catch (err) {
		console.error('CountQuantityCart error:', err);
		return res.status(500).json({ status: 'error', message: 'Internal server error' });
	}	
}

// Upload avatar
async function uploadUserAvatar(req, res) {
	try {
		const userId = req.user?.userId;
		if (!userId) {
			return res.status(401).json({ status: 'error', message: 'Unauthorized' });
		}

		if (!req.file) {
			return res.status(400).json({ status: 'error', message: 'Không có file được tải lên' });
		}

		// Lấy avatar cũ từ database
		const [rows] = await pool.execute(
			'SELECT url_hinh_dai_dien FROM nguoi_dung WHERE ma_nguoi_dung = ?',
			[userId]
		);

		const oldAvatarUrl = rows[0]?.url_hinh_dai_dien;

		// Xóa avatar cũ nếu tồn tại
		if (oldAvatarUrl) {
			// Loại bỏ dấu / ở đầu để tạo đường dẫn đúng
			const relativePath = oldAvatarUrl.replace(/^\//, '');
			const oldAvatarPath = path.join(__dirname, '..', relativePath);
			if (fs.existsSync(oldAvatarPath)) {
				try {
					fs.unlinkSync(oldAvatarPath);
					console.log('Đã xóa avatar cũ:', oldAvatarPath);
				} catch (delErr) {
					console.error('Lỗi khi xóa avatar cũ:', delErr);
				}
			}
		}

		// Tạo URL cho avatar (đường dẫn tương đối)
		const avatarUrl = `/uploads/avatars/${req.file.filename}`;

		// Cập nhật avatar URL vào database
		await pool.execute(
			'UPDATE nguoi_dung SET url_hinh_dai_dien = ? WHERE ma_nguoi_dung = ?',
			[avatarUrl, userId]
		);

		return res.json({
			status: 'success',
			message: 'Upload avatar thành công',
			avatarUrl: avatarUrl
		});
	} catch (err) {
		console.error('uploadUserAvatar error:', err);
		// Xóa file đã upload nếu có lỗi
		if (req.file) {
			fs.unlinkSync(req.file.path);
		}
		return res.status(500).json({ status: 'error', message: 'Internal server error' });
	}
}



module.exports = {
	listUsers,
	createUser,
	updateUser,
	deleteUser,
	getCurrentUser,
	updateCurrentUser,
	updateUserPassword,
	CountQuantityCart,
	uploadUserAvatar,
	uploadAvatar
};
