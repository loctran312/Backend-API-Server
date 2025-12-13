-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 13, 2025 at 09:02 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `shoplen`
--

-- --------------------------------------------------------

--
-- Table structure for table `bien_the_san_pham`
--

DROP TABLE IF EXISTS `bien_the_san_pham`;
CREATE TABLE IF NOT EXISTS `bien_the_san_pham` (
  `ma_bien_the` int NOT NULL AUTO_INCREMENT,
  `ma_san_pham` int NOT NULL,
  `mau_sac` varchar(50) DEFAULT NULL,
  `kich_co` varchar(50) DEFAULT NULL,
  `chat_lieu` varchar(100) DEFAULT NULL,
  `url_hinh_anh_bien_the` varchar(255) NOT NULL,
  `gia_them` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`ma_bien_the`),
  KEY `ma_san_pham` (`ma_san_pham`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bien_the_san_pham`
--

INSERT INTO `bien_the_san_pham` (`ma_bien_the`, `ma_san_pham`, `mau_sac`, `kich_co`, `chat_lieu`, `url_hinh_anh_bien_the`, `gia_them`) VALUES
(47, 28, 'Hồng Wool', '100g', 'Wool', 'http://localhost:3000/uploads/collection1-1765002786480-920104436.png', 0.00),
(48, 28, 'Đỏ Wool', '100g', 'Wool', 'http://localhost:3000/uploads/down4-1765002786484-670254321.png', 55000.00),
(53, 27, 'Hồng Pastel', '100g', 'Cotton', 'http://localhost:3000/uploads/item1-1764770677147-827675066.png', 49000.00),
(54, 27, 'Xanh Pastel', '100g', 'Cotton', 'http://localhost:3000/uploads/collection2-1764770677152-863891815.png', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `chi_tiet_don_hang`
--

DROP TABLE IF EXISTS `chi_tiet_don_hang`;
CREATE TABLE IF NOT EXISTS `chi_tiet_don_hang` (
  `ma_chi_tiet` int NOT NULL AUTO_INCREMENT,
  `ma_don_hang` int DEFAULT NULL,
  `ma_san_pham` int DEFAULT NULL,
  `ma_bien_the` int DEFAULT NULL,
  `so_luong` int DEFAULT NULL,
  `gia` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`ma_chi_tiet`),
  KEY `ma_don_hang` (`ma_don_hang`),
  KEY `ma_san_pham` (`ma_san_pham`),
  KEY `ma_bien_the` (`ma_bien_the`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danh_gia`
--

DROP TABLE IF EXISTS `danh_gia`;
CREATE TABLE IF NOT EXISTS `danh_gia` (
  `ma_danh_gia` int NOT NULL AUTO_INCREMENT,
  `ma_san_pham` int NOT NULL,
  `ma_nguoi_dung` int NOT NULL,
  `diem_danh_gia` int DEFAULT NULL,
  `binh_luan` text,
  `thoi_gian_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_danh_gia`),
  KEY `ma_san_pham` (`ma_san_pham`),
  KEY `ma_nguoi_dung` (`ma_nguoi_dung`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danh_muc`
--

DROP TABLE IF EXISTS `danh_muc`;
CREATE TABLE IF NOT EXISTS `danh_muc` (
  `ma_danh_muc` int NOT NULL AUTO_INCREMENT,
  `ten_danh_muc` varchar(100) NOT NULL,
  `mo_ta` text,
  PRIMARY KEY (`ma_danh_muc`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `danh_muc`
--

INSERT INTO `danh_muc` (`ma_danh_muc`, `ten_danh_muc`, `mo_ta`) VALUES
(1, 'Len', NULL),
(2, 'Công cụ', NULL),
(3, 'Workshop', '');

-- --------------------------------------------------------

--
-- Table structure for table `don_hang`
--

DROP TABLE IF EXISTS `don_hang`;
CREATE TABLE IF NOT EXISTS `don_hang` (
  `ma_don_hang` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL,
  `ngay_dat_hang` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` enum('cho_xu_ly','da_thanh_toan','dang_giao','hoan_thanh','da_huy') DEFAULT 'cho_xu_ly',
  `tong_tien` decimal(10,2) DEFAULT NULL,
  `ghi_chu` text,
  `ma_thanhpho` int DEFAULT NULL,
  `ma_quan` int DEFAULT NULL,
  `ma_phuong` int DEFAULT NULL,
  `dia_chi_giao_hang` varchar(255) DEFAULT NULL,
  `thoi_gian_cap_nhat` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_don_hang`),
  KEY `ma_nguoi_dung` (`ma_nguoi_dung`),
  KEY `ma_thanhpho` (`ma_thanhpho`),
  KEY `ma_quan` (`ma_quan`),
  KEY `ma_phuong` (`ma_phuong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gio_hang`
--

DROP TABLE IF EXISTS `gio_hang`;
CREATE TABLE IF NOT EXISTS `gio_hang` (
  `ma_gio_hang` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL,
  `ma_san_pham` int DEFAULT NULL,
  `ma_bien_the` int DEFAULT NULL,
  `so_luong` int DEFAULT '1',
  PRIMARY KEY (`ma_gio_hang`),
  KEY `ma_nguoi_dung` (`ma_nguoi_dung`),
  KEY `ma_san_pham` (`ma_san_pham`),
  KEY `gio_hang_fk_variant` (`ma_bien_the`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hinh_anh_bien_the`
--

DROP TABLE IF EXISTS `hinh_anh_bien_the`;
CREATE TABLE IF NOT EXISTS `hinh_anh_bien_the` (
  `ma_hinh_anh` int NOT NULL AUTO_INCREMENT,
  `ma_bien_the` int NOT NULL,
  `url_hinh_anh` varchar(255) NOT NULL,
  `thu_tu` int DEFAULT '0',
  PRIMARY KEY (`ma_hinh_anh`),
  KEY `ma_bien_the` (`ma_bien_the`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hinh_anh_bien_the`
--

INSERT INTO `hinh_anh_bien_the` (`ma_hinh_anh`, `ma_bien_the`, `url_hinh_anh`, `thu_tu`) VALUES
(51, 47, 'http://localhost:3000/uploads/item4-1765002786481-507588849.png', 1),
(52, 47, 'http://localhost:3000/uploads/collection1-1765002786480-920104436.png', 0),
(53, 48, 'http://localhost:3000/uploads/down4-1765002786484-670254321.png', 0),
(60, 53, 'http://localhost:3000/uploads/item1-1764770677147-827675066.png', 0),
(61, 53, 'http://localhost:3000/uploads/collection4-1764770677150-773351408.png', 1),
(62, 54, 'http://localhost:3000/uploads/collection2-1764770677152-863891815.png', 0);

-- --------------------------------------------------------

--
-- Table structure for table `hinh_anh_san_pham`
--

DROP TABLE IF EXISTS `hinh_anh_san_pham`;
CREATE TABLE IF NOT EXISTS `hinh_anh_san_pham` (
  `ma_hinh_anh` int NOT NULL AUTO_INCREMENT,
  `ma_san_pham` int NOT NULL,
  `url_hinh_anh` varchar(255) NOT NULL,
  `thu_tu` int DEFAULT '0',
  PRIMARY KEY (`ma_hinh_anh`),
  KEY `ma_san_pham` (`ma_san_pham`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kho`
--

DROP TABLE IF EXISTS `kho`;
CREATE TABLE IF NOT EXISTS `kho` (
  `ma_kho` int NOT NULL AUTO_INCREMENT,
  `ten_kho` varchar(100) NOT NULL,
  `dia_chi` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ma_kho`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `kho`
--

INSERT INTO `kho` (`ma_kho`, `ten_kho`, `dia_chi`) VALUES
(1, 'Peace Chill', '180 Cao Lỗ, Quận 8, Thành phố Hồ Chí Minh');

-- --------------------------------------------------------

--
-- Table structure for table `khuyen_mai`
--

DROP TABLE IF EXISTS `khuyen_mai`;
CREATE TABLE IF NOT EXISTS `khuyen_mai` (
  `ma_khuyen_mai` int NOT NULL AUTO_INCREMENT,
  `tieu_de` varchar(100) DEFAULT NULL,
  `phan_tram_giam` decimal(5,2) DEFAULT NULL,
  `ngay_bat_dau` date DEFAULT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  PRIMARY KEY (`ma_khuyen_mai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loai_san_pham`
--

DROP TABLE IF EXISTS `loai_san_pham`;
CREATE TABLE IF NOT EXISTS `loai_san_pham` (
  `ma_loai` int NOT NULL AUTO_INCREMENT,
  `ten_loai` varchar(100) NOT NULL,
  `mo_ta` text,
  PRIMARY KEY (`ma_loai`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `loai_san_pham`
--

INSERT INTO `loai_san_pham` (`ma_loai`, `ten_loai`, `mo_ta`) VALUES
(1, 'Len', NULL),
(2, 'Công cụ', NULL),
(3, 'Workshop', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `nguoi_dung`
--

DROP TABLE IF EXISTS `nguoi_dung`;
CREATE TABLE IF NOT EXISTS `nguoi_dung` (
  `ma_nguoi_dung` int NOT NULL AUTO_INCREMENT,
  `ho_ten` varchar(100) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mat_khau` varchar(255) NOT NULL,
  `so_dien_thoai` varchar(15) DEFAULT NULL,
  `dia_chi` varchar(255) DEFAULT NULL,
  `thanh_pho` varchar(100) DEFAULT NULL,
  `vai_tro` enum('admin','khach_hang','nhan_vien') DEFAULT 'khach_hang',
  `thoi_gian_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_nguoi_dung`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `nguoi_dung`
--

INSERT INTO `nguoi_dung` (`ma_nguoi_dung`, `ho_ten`, `first_name`, `last_name`, `username`, `email`, `mat_khau`, `so_dien_thoai`, `dia_chi`, `thanh_pho`, `vai_tro`, `thoi_gian_tao`) VALUES
(1, 'admin', 'Ếch', 'Con', 'admin', 'admin@gmail.com', '$2b$10$Pxj8Jfy562HgWoVkWN3jZ.kWxVSSqWIJu97LgOIwdMsSaxO8GZa2K', '0987654321', '181 Cao Lỗ', 'TP HCM', 'admin', '2025-11-03 16:09:47'),
(2, 'Ếch Con', 'Ếch', 'Con', 'user1', 'user1@gmail.com', '$2b$10$XARtrRSHRGaEjZAr28.wL.DIyOFL3..caI3xAIVQQu7lYtfKuImE6', '0123456789', '180 Cao Lỗ', 'HCM', 'khach_hang', '2025-11-19 10:58:31');

-- --------------------------------------------------------

--
-- Table structure for table `nhan_vien`
--

DROP TABLE IF EXISTS `nhan_vien`;
CREATE TABLE IF NOT EXISTS `nhan_vien` (
  `ma_nhan_vien` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL,
  `chuc_vu` enum('nv_ban_hang','nv_kho') NOT NULL,
  `luong` decimal(12,2) DEFAULT NULL,
  `ngay_vao_lam` date DEFAULT NULL,
  `trang_thai` enum('dang_lam','nghi_viec') DEFAULT 'dang_lam',
  PRIMARY KEY (`ma_nhan_vien`),
  UNIQUE KEY `ma_nguoi_dung` (`ma_nguoi_dung`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `phuong`
--

DROP TABLE IF EXISTS `phuong`;
CREATE TABLE IF NOT EXISTS `phuong` (
  `ma_phuong` int NOT NULL AUTO_INCREMENT,
  `ten_phuong` varchar(100) NOT NULL,
  `ma_quan` int DEFAULT NULL,
  PRIMARY KEY (`ma_phuong`),
  KEY `ma_quan` (`ma_quan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quan`
--

DROP TABLE IF EXISTS `quan`;
CREATE TABLE IF NOT EXISTS `quan` (
  `ma_quan` int NOT NULL AUTO_INCREMENT,
  `ten_quan` varchar(100) NOT NULL,
  `ma_thanhpho` int DEFAULT NULL,
  PRIMARY KEY (`ma_quan`),
  KEY `ma_thanhpho` (`ma_thanhpho`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `san_pham`
--

DROP TABLE IF EXISTS `san_pham`;
CREATE TABLE IF NOT EXISTS `san_pham` (
  `ma_san_pham` int NOT NULL AUTO_INCREMENT,
  `ma_loai` int NOT NULL,
  `ma_danh_muc` int NOT NULL,
  `ten_san_pham` varchar(150) NOT NULL,
  `gia` decimal(10,2) NOT NULL,
  `mo_ta` text,
  `hinh_anh_url` varchar(255) DEFAULT NULL,
  `thoi_gian_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `thoi_gian_cap_nhat` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_san_pham`),
  KEY `ma_danh_muc` (`ma_danh_muc`),
  KEY `ma_loai` (`ma_loai`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `san_pham`
--

INSERT INTO `san_pham` (`ma_san_pham`, `ma_loai`, `ma_danh_muc`, `ten_san_pham`, `gia`, `mo_ta`, `hinh_anh_url`, `thoi_gian_tao`, `thoi_gian_cap_nhat`) VALUES
(27, 1, 1, 'Len Cotton Milk Premium', 45000.00, '', NULL, '2025-12-03 21:04:37', '2025-12-03 21:04:37'),
(28, 1, 1, 'Len Wool Premium', 50000.00, '', NULL, '2025-12-06 13:33:06', '2025-12-06 13:33:06');

-- --------------------------------------------------------

--
-- Table structure for table `san_pham_khuyen_mai`
--

DROP TABLE IF EXISTS `san_pham_khuyen_mai`;
CREATE TABLE IF NOT EXISTS `san_pham_khuyen_mai` (
  `ma_san_pham` int NOT NULL,
  `ma_khuyen_mai` int NOT NULL,
  `ngay_ap_dung` date DEFAULT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  `ghi_chu` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ma_san_pham`,`ma_khuyen_mai`),
  KEY `ma_khuyen_mai` (`ma_khuyen_mai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thanhpho`
--

DROP TABLE IF EXISTS `thanhpho`;
CREATE TABLE IF NOT EXISTS `thanhpho` (
  `ma_thanhpho` int NOT NULL AUTO_INCREMENT,
  `ten_thanhpho` varchar(100) NOT NULL,
  PRIMARY KEY (`ma_thanhpho`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thanh_toan`
--

DROP TABLE IF EXISTS `thanh_toan`;
CREATE TABLE IF NOT EXISTS `thanh_toan` (
  `ma_thanh_toan` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL,
  `ma_don_hang` int DEFAULT NULL,
  `so_tien` decimal(10,2) DEFAULT NULL,
  `phuong_thuc` enum('tien_mat','chuyen_khoan','momo') DEFAULT 'tien_mat',
  `trang_thai` enum('cho_xu_ly','thanh_cong','that_bai') DEFAULT 'cho_xu_ly',
  `thoi_gian_thanh_toan` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_thanh_toan`),
  KEY `ma_nguoi_dung` (`ma_nguoi_dung`),
  KEY `ma_don_hang` (`ma_don_hang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ton_kho`
--

DROP TABLE IF EXISTS `ton_kho`;
CREATE TABLE IF NOT EXISTS `ton_kho` (
  `ma_ton` int NOT NULL AUTO_INCREMENT,
  `ma_kho` int DEFAULT NULL,
  `ma_san_pham` int DEFAULT NULL,
  `ma_bien_the` int DEFAULT NULL,
  `so_luong_ton` int DEFAULT '0',
  PRIMARY KEY (`ma_ton`),
  KEY `ma_kho` (`ma_kho`),
  KEY `ma_san_pham` (`ma_san_pham`),
  KEY `ma_bien_the` (`ma_bien_the`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ton_kho`
--

INSERT INTO `ton_kho` (`ma_ton`, `ma_kho`, `ma_san_pham`, `ma_bien_the`, `so_luong_ton`) VALUES
(22, 1, 28, 47, 90),
(23, 1, 28, 48, 95),
(28, 1, 27, 53, 99),
(29, 1, 27, 54, 98);

-- --------------------------------------------------------

--
-- Table structure for table `workshop`
--

DROP TABLE IF EXISTS `workshop`;
CREATE TABLE IF NOT EXISTS `workshop` (
  `ma_workshop` int NOT NULL AUTO_INCREMENT,
  `ma_san_pham` int DEFAULT NULL,
  `tieu_de` varchar(150) DEFAULT NULL,
  `mo_ta` text,
  `ngay_bat_dau` datetime DEFAULT NULL,
  `ngay_ket_thuc` datetime DEFAULT NULL,
  `so_luong_toi_da` int DEFAULT NULL,
  PRIMARY KEY (`ma_workshop`),
  UNIQUE KEY `ma_san_pham` (`ma_san_pham`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bien_the_san_pham`
--
ALTER TABLE `bien_the_san_pham`
  ADD CONSTRAINT `bien_the_san_pham_ibfk_1` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`);

--
-- Constraints for table `chi_tiet_don_hang`
--
ALTER TABLE `chi_tiet_don_hang`
  ADD CONSTRAINT `chi_tiet_don_hang_ibfk_1` FOREIGN KEY (`ma_don_hang`) REFERENCES `don_hang` (`ma_don_hang`),
  ADD CONSTRAINT `chi_tiet_don_hang_ibfk_2` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`),
  ADD CONSTRAINT `chi_tiet_don_hang_ibfk_3` FOREIGN KEY (`ma_bien_the`) REFERENCES `bien_the_san_pham` (`ma_bien_the`);

--
-- Constraints for table `don_hang`
--
ALTER TABLE `don_hang`
  ADD CONSTRAINT `don_hang_ibfk_1` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`),
  ADD CONSTRAINT `don_hang_ibfk_2` FOREIGN KEY (`ma_thanhpho`) REFERENCES `thanhpho` (`ma_thanhpho`),
  ADD CONSTRAINT `don_hang_ibfk_3` FOREIGN KEY (`ma_quan`) REFERENCES `quan` (`ma_quan`),
  ADD CONSTRAINT `don_hang_ibfk_4` FOREIGN KEY (`ma_phuong`) REFERENCES `phuong` (`ma_phuong`);

--
-- Constraints for table `gio_hang`
--
ALTER TABLE `gio_hang`
  ADD CONSTRAINT `gio_hang_fk_variant` FOREIGN KEY (`ma_bien_the`) REFERENCES `bien_the_san_pham` (`ma_bien_the`) ON DELETE SET NULL,
  ADD CONSTRAINT `gio_hang_ibfk_1` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`),
  ADD CONSTRAINT `gio_hang_ibfk_2` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`);

--
-- Constraints for table `hinh_anh_bien_the`
--
ALTER TABLE `hinh_anh_bien_the`
  ADD CONSTRAINT `hinh_anh_bien_the_ibfk_1` FOREIGN KEY (`ma_bien_the`) REFERENCES `bien_the_san_pham` (`ma_bien_the`) ON DELETE CASCADE;

--
-- Constraints for table `hinh_anh_san_pham`
--
ALTER TABLE `hinh_anh_san_pham`
  ADD CONSTRAINT `hinh_anh_san_pham_ibfk_1` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`) ON DELETE CASCADE;

--
-- Constraints for table `nhan_vien`
--
ALTER TABLE `nhan_vien`
  ADD CONSTRAINT `nhan_vien_ibfk_1` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`);

--
-- Constraints for table `phuong`
--
ALTER TABLE `phuong`
  ADD CONSTRAINT `phuong_ibfk_1` FOREIGN KEY (`ma_quan`) REFERENCES `quan` (`ma_quan`);

--
-- Constraints for table `quan`
--
ALTER TABLE `quan`
  ADD CONSTRAINT `quan_ibfk_1` FOREIGN KEY (`ma_thanhpho`) REFERENCES `thanhpho` (`ma_thanhpho`);

--
-- Constraints for table `san_pham`
--
ALTER TABLE `san_pham`
  ADD CONSTRAINT `san_pham_ibfk_1` FOREIGN KEY (`ma_danh_muc`) REFERENCES `danh_muc` (`ma_danh_muc`),
  ADD CONSTRAINT `san_pham_ibfk_2` FOREIGN KEY (`ma_loai`) REFERENCES `loai_san_pham` (`ma_loai`);

--
-- Constraints for table `san_pham_khuyen_mai`
--
ALTER TABLE `san_pham_khuyen_mai`
  ADD CONSTRAINT `san_pham_khuyen_mai_ibfk_1` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`),
  ADD CONSTRAINT `san_pham_khuyen_mai_ibfk_2` FOREIGN KEY (`ma_khuyen_mai`) REFERENCES `khuyen_mai` (`ma_khuyen_mai`);

--
-- Constraints for table `thanh_toan`
--
ALTER TABLE `thanh_toan`
  ADD CONSTRAINT `thanh_toan_ibfk_1` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`),
  ADD CONSTRAINT `thanh_toan_ibfk_2` FOREIGN KEY (`ma_don_hang`) REFERENCES `don_hang` (`ma_don_hang`);

--
-- Constraints for table `ton_kho`
--
ALTER TABLE `ton_kho`
  ADD CONSTRAINT `ton_kho_ibfk_1` FOREIGN KEY (`ma_kho`) REFERENCES `kho` (`ma_kho`),
  ADD CONSTRAINT `ton_kho_ibfk_2` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`),
  ADD CONSTRAINT `ton_kho_ibfk_3` FOREIGN KEY (`ma_bien_the`) REFERENCES `bien_the_san_pham` (`ma_bien_the`);

--
-- Constraints for table `workshop`
--
ALTER TABLE `workshop`
  ADD CONSTRAINT `workshop_ibfk_1` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
