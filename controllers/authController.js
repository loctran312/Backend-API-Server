const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Đăng ký người dùng mới
const register = async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      username,
      password,
      email,
      phone,
      address,
      city
    } = req.body;

    // Validate dữ liệu đầu vào
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Username, Email, Mật khẩu)'
      });
    }

    // Validate username format đơn giản
    // Chỉ kiểm tra độ dài và không có khoảng trắng
    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      return res.status(400).json({
        status: 'error',
        message: 'Username phải có từ 3 đến 50 ký tự'
      });
    }
    
    // Kiểm tra không có khoảng trắng
    if (/\s/.test(trimmedUsername)) {
      return res.status(400).json({
        status: 'error',
        message: 'Username không được chứa khoảng trắng'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email?.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Email không hợp lệ'
      });
    }

        // Kiểm tra username đã tồn tại chưa
    const [existingUsername] = await pool.execute(
      'SELECT ma_nguoi_dung FROM nguoi_dung WHERE username = ?',
      [trimmedUsername]
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Username này đã được sử dụng'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const [existingEmail] = await pool.execute(
      'SELECT ma_nguoi_dung FROM nguoi_dung WHERE email = ?',
      [email.trim()]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Email này đã được sử dụng'
      });
    }

    // Mã hóa mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Thêm người dùng mới vào database
    const first = firstName?.trim() || null;
    const last = lastName?.trim() || null;
    const fullName = (name?.trim()) || `${first || ''} ${last || ''}`.trim();

    const [result] = await pool.execute(
      `INSERT INTO nguoi_dung (ho_ten, first_name, last_name, username, email, mat_khau, so_dien_thoai, dia_chi, thanh_pho, vai_tro) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'khach_hang')`,
       [
        fullName || trimmedUsername,
        first,
        last,
        trimmedUsername,
        email.trim(),
        hashedPassword,
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        city ? city.trim() : null
       ]
    );

    res.status(201).json({
      status: 'success',
      message: 'Đăng ký thành công! Vui lòng đăng nhập.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Lỗi đăng ký:', error);
        // Xử lý lỗi duplicate entry (MySQL error 1062)
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage.includes('username')) {
        return res.status(400).json({
          status: 'error',
          message: 'Username này đã được sử dụng'
        });
      } else if (error.sqlMessage.includes('email')) {
        return res.status(400).json({
          status: 'error',
          message: 'Email này đã được sử dụng'
        });
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi đăng ký. Vui lòng thử lại sau.'
    });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate dữ liệu đầu vào
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập email/username và mật khẩu'
      });
    }

    // Tìm người dùng theo username hoặc email
    // Có thể đăng nhập bằng username hoặc email
    const [users] = await pool.execute(
      'SELECT * FROM nguoi_dung WHERE username = ? OR email = ?',
      [username.trim(), username.trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Username hoặc mật khẩu không đúng'
      });
    }

    const user = users[0];

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.mat_khau);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      {
        userId: user.ma_nguoi_dung,
        email: user.email,
        username: user.username,
        role: user.vai_tro
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Trả về thông tin người dùng (không bao gồm mật khẩu)
    res.json({
      status: 'success',
      message: 'Đăng nhập thành công',
      token: token,
      user: {
        id: user.ma_nguoi_dung,
        name: user.ho_ten,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        email: user.email,
        phone: user.so_dien_thoai,
        address: user.dia_chi,
        city: user.thanh_pho,
        role: user.vai_tro
      },
      // Giữ tương thích với frontend hiện tại
      role: user.vai_tro,
      email: user.email,
      username: user.username
    });

  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi đăng nhập. Vui lòng thử lại sau.'
    });
  }
};

// Xác thực token (middleware helper)
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Không có token xác thực'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
};

module.exports = {
  register,
  login,
  verifyToken
};