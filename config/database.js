const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'yarn',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test kết nối database
pool.getConnection()
  .then(connection => {
    console.log('✅ Kết nối database thành công!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối database:', err.message);
  });

module.exports = pool;

