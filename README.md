# ShopLen Backend API Server

Backend API server cho ứng dụng ShopLen được xây dựng bằng Node.js, Express và MySQL.

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Sao chép file `.env.example` thành `.env` và điền thông tin của bạn:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=Shoplen
PORT=3000
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5500
```

### 3. Tạo database

Đảm bảo bạn đã tạo database từ file `Shoplen.sql` trong thư mục gốc của project.

### 4. Chạy server

```bash
# Development mode (với nodemon - tự động restart)
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## 📡 API Endpoints

### Đăng ký tài khoản
- **URL:** `POST /auth/register`
- **Body:**
```json
{
  "name": "Nguyễn Văn A",
  "username": "nguyenvana", // Optional
  "email": "nguyenvana@example.com",
  "password": "password123",
  "phone": "0123456789", // Optional
  "address": "" // Optional
}
```

- **Response thành công:**
```json
{
  "status": "success",
  "message": "Đăng ký thành công! Vui lòng đăng nhập.",
  "userId": 1
}
```

### Đăng nhập
- **URL:** `POST /auth/login`
- **Body:**
```json
{
  "username": "nguyenvana@example.com", // Email hoặc username
  "password": "password123"
}
```

- **Response thành công:**
```json
{
  "status": "success",
  "message": "Đăng nhập thành công",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "phone": "0123456789",
    "role": "khach_hang"
  },
  "role": "khach_hang",
  "email": "nguyenvana@example.com"
}
```

### Health Check
- **URL:** `GET /health`
- **Response:**
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔒 Bảo mật

- Mật khẩu được mã hóa bằng bcrypt với salt rounds = 10
- JWT token được sử dụng để xác thực người dùng
- CORS được cấu hình để chỉ cho phép frontend từ host được chỉ định

## 📝 Lưu ý

1. **CORS:** Trong production, nhớ cập nhật `FRONTEND_URL` trong file `.env` với URL thực tế của frontend
2. **JWT Secret:** Luôn thay đổi `JWT_SECRET` trong production
3. **Database:** Đảm bảo database đã được tạo và có đầy đủ bảng từ file `Shoplen.sql`

## 🛠️ Cấu trúc thư mục

```
Server/
├── config/
│   └── database.js      # Cấu hình kết nối MySQL
├── controllers/
│   └── authController.js # Logic xử lý authentication
├── routes/
│   └── auth.js          # Routes cho authentication
├── .env                 # File cấu hình (không commit)
├── .env.example         # Template file cấu hình
├── package.json
├── server.js            # File chính của server
└── README.md
```

## 📦 Dependencies

- **express**: Web framework
- **mysql2**: MySQL client cho Node.js
- **bcrypt**: Mã hóa mật khẩu
- **jsonwebtoken**: Tạo và xác thực JWT tokens
- **cors**: Xử lý CORS
- **dotenv**: Quản lý biến môi trường