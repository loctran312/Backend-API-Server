const pool = require('../config/database');
const bcrypt = require('bcrypt');

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

module.exports = {
	listUsers,
	createUser,
	updateUser,
	deleteUser,
	getCurrentUser,
	updateCurrentUser
};
