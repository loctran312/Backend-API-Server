
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const catagoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Cho phép tất cả origin trong môi trường development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Kiểm tra server
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/category', catagoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  // Nếu là lỗi Multer, trả về thông báo rõ ràng hơn
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      status: 'error',
      message: 'Field không hợp lệ trong form upload',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - POST /auth/register`);
  console.log(`   - POST /auth/login`);
  console.log(`   - GET  /products`);
  console.log(`   - GET  /products/:id`);
  console.log(`   - POST /products (admin)`);
  console.log(`   - PUT  /products/:id (admin)`);
  console.log(`   - DELETE /products/:id (admin)`);
  console.log(`   - GET  /users (admin)`);
  console.log(`   - POST /users (admin)`);
  console.log(`   - PUT  /users/:id (admin)`);
  console.log(`   - DELETE /users/:id (admin)`);
  console.log(`   - GET  /health`);
});

module.exports = app;