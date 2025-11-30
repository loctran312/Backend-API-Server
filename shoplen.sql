-- ph... SQLINES DEMO ***
-- ve... SQLINES DEMO ***
-- SQLINES DEMO *** admin.net/
--
-- SQLINES DEMO *** 306
-- SQLINES DEMO *** Nov 08, 2025 at 11:49 AM
-- SQLINES DEMO *** .1.0
-- PH... SQLINES DEMO ***

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/* SQLINES DEMO *** CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/* SQLINES DEMO *** CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/* SQLINES DEMO *** COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/* SQLINES DEMO ***  utf8mb4 */;

--
-- Da... SQLINES DEMO ***
--

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `bien_the_san_pham`
--

DROP TABLE IF EXISTS `bien_the_san_pham`;
-- SQLINES FOR EVALUATION USE ONLY (14 DAYS)
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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `bien_the_san_pham` (`ma_bien_the`, `ma_san_pham`, `mau_sac`, `kich_co`, `chat_lieu`, `url_hinh_anh_bien_the`, `gia_them`) VALUES
(14, 12, 'Hồng Pastel', '100g', 'Milk Cotton', '/uploads/item1-1764433295742-524867427.png', 0.00),
(15, 12, 'Xanh Pastel', '100g', 'Milk Cotton', '/uploads/collection2-1764433295747-568464108.png', 0.00),
(16, 13, 'Xanh Pastel', '200g', 'Wool', '/uploads/item5-1764434065626-491115620.png', 0.00);

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `chi_tiet_don_hang`
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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `danh_gia`
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
) ;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `danh_muc`
--

DROP TABLE IF EXISTS `danh_muc`;
CREATE TABLE IF NOT EXISTS `danh_muc` (
  `ma_danh_muc` int NOT NULL AUTO_INCREMENT,
  `ten_danh_muc` varchar(100) NOT NULL,
  `mo_ta` text,
  PRIMARY KEY (`ma_danh_muc`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `danh_muc` (`ma_danh_muc`, `ten_danh_muc`, `mo_ta`) VALUES
(1, 'Len', NULL),
(2, 'Công cụ', NULL),
(3, 'Workshop', NULL);

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `don_hang`
--

DROP TABLE IF EXISTS `don_hang`;
CREATE TABLE IF NOT EXISTS `don_hang` (
  `ma_don_hang` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL,
  `ngay_dat_hang` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` varchar(30) check (`trang_thai` in ('cho_xu_ly','da_thanh_toan','dang_giao','hoan_thanh','da_huy')) DEFAULT 'cho_xu_ly',
  `tong_tien` decimal(10,2) DEFAULT NULL,
  `ghi_chu` text,
  `ma_thanhpho` int DEFAULT NULL,
  `ma_quan` int DEFAULT NULL,
  `ma_phuong` int DEFAULT NULL,
  `dia_chi_giao_hang` varchar(255) DEFAULT NULL,
  `thoi_gian_cap_nhat` datetime DEFAULT CURRENT_TIMESTAMP /* ON UPDATE CURRENT_TIMESTAMP */,
  PRIMARY KEY (`ma_don_hang`),
  KEY `ma_nguoi_dung` (`ma_nguoi_dung`),
  KEY `ma_thanhpho` (`ma_thanhpho`),
  KEY `ma_quan` (`ma_quan`),
  KEY `ma_phuong` (`ma_phuong`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `gio_hang`
--

DROP TABLE IF EXISTS `gio_hang`;
CREATE TABLE IF NOT EXISTS `gio_hang` (
  `ma_gio_hang` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL,
  `ma_san_pham` int DEFAULT NULL,
  `so_luong` int DEFAULT '1',
  PRIMARY KEY (`ma_gio_hang`),
  KEY `ma_nguoi_dung` (`ma_nguoi_dung`),
  KEY `ma_san_pham` (`ma_san_pham`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------


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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hinh_anh_bien_the`
--

INSERT INTO `hinh_anh_bien_the` (`ma_hinh_anh`, `ma_bien_the`, `url_hinh_anh`, `thu_tu`) VALUES
(3, 14, '/uploads/item1-1764433295742-524867427.png', 0),
(4, 14, '/uploads/collection4-1764433295746-528247569.png', 1),
(5, 15, '/uploads/collection2-1764433295747-568464108.png', 0),
(6, 16, '/uploads/item5-1764434065626-491115620.png', 0);

--
-- SQLINES DEMO *** or table `kho`
--

DROP TABLE IF EXISTS `kho`;
CREATE TABLE IF NOT EXISTS `kho` (
  `ma_kho` int NOT NULL AUTO_INCREMENT,
  `ten_kho` varchar(100) NOT NULL,
  `dia_chi` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ma_kho`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `khuyen_mai`
--

DROP TABLE IF EXISTS `khuyen_mai`;
CREATE TABLE IF NOT EXISTS `khuyen_mai` (
  `ma_khuyen_mai` int NOT NULL AUTO_INCREMENT,
  `tieu_de` varchar(100) DEFAULT NULL,
  `phan_tram_giam` decimal(5,2) DEFAULT NULL,
  `ngay_bat_dau` date DEFAULT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  PRIMARY KEY (`ma_khuyen_mai`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `nguoi_dung`
--

DROP TABLE IF EXISTS `nguoi_dung`;
CREATE TABLE IF NOT EXISTS `nguoi_dung` (
  `ma_nguoi_dung` int NOT NULL AUTO_INCREMENT,
  `ho_ten` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mat_khau` varchar(255) NOT NULL,
  `so_dien_thoai` varchar(15) DEFAULT NULL,
  `vai_tro` varchar(30) check (`vai_tro` in ('admin','khach_hang','nhan_vien')) DEFAULT 'khach_hang',
  `thoi_gian_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_nguoi_dung`),
  CONSTRAINT `username` UNIQUE (`username`),
  CONSTRAINT `email` UNIQUE (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- SQLINES DEMO *** table `nguoi_dung`
--

INSERT INTO `nguoi_dung` (`ma_nguoi_dung`, `ho_ten`, `username`, `email`, `mat_khau`, `so_dien_thoai`, `vai_tro`, `thoi_gian_tao`) VALUES
(1, 'a b', 'ab123', 'ab@gmail.com', '$2b$10$nHKs01Q3mNLZZ8.NGXDBWeWBTJoutYKGV1M6EQXxAwKAuEbopMJNW', '0123456789', 'khach_hang', '2025-11-03 15:50:51'),
(2, 'a b c', 'admin', 'admin@gmail.com', '$2b$10$Pxj8Jfy562HgWoVkWN3jZ.kWxVSSqWIJu97LgOIwdMsSaxO8GZa2K', '0987654321', 'admin', '2025-11-03 16:09:47');

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `nhan_vien`
--

DROP TABLE IF EXISTS `nhan_vien`;
CREATE TABLE IF NOT EXISTS `nhan_vien` (
  `ma_nhan_vien` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL,
  `chuc_vu` varchar(30) check (`chuc_vu` in ('nv_ban_hang','nv_kho')) NOT NULL,
  `luong` decimal(12,2) DEFAULT NULL,
  `ngay_vao_lam` date DEFAULT NULL,
  `trang_thai` varchar(30) check (`trang_thai` in ('dang_lam','nghi_viec')) DEFAULT 'dang_lam',
  PRIMARY KEY (`ma_nhan_vien`),
  CONSTRAINT `ma_nguoi_dung` UNIQUE (`ma_nguoi_dung`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `phuong`
--

DROP TABLE IF EXISTS `phuong`;
CREATE TABLE IF NOT EXISTS `phuong` (
  `ma_phuong` int NOT NULL AUTO_INCREMENT,
  `ten_phuong` varchar(100) NOT NULL,
  `ma_quan` int DEFAULT NULL,
  PRIMARY KEY (`ma_phuong`),
  KEY `ma_quan` (`ma_quan`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `quan`
--

DROP TABLE IF EXISTS `quan`;
CREATE TABLE IF NOT EXISTS `quan` (
  `ma_quan` int NOT NULL AUTO_INCREMENT,
  `ten_quan` varchar(100) NOT NULL,
  `ma_thanhpho` int DEFAULT NULL,
  PRIMARY KEY (`ma_quan`),
  KEY `ma_thanhpho` (`ma_thanhpho`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `san_pham`
--

DROP TABLE IF EXISTS `san_pham`;
CREATE TABLE IF NOT EXISTS `san_pham` (
  `ma_san_pham` int NOT NULL AUTO_INCREMENT,
  `ma_danh_muc` int DEFAULT NULL,
  `ten_san_pham` varchar(150) NOT NULL,
  `gia` decimal(10,2) NOT NULL,
  `mo_ta` text,
  `hinh_anh_url` varchar(255) DEFAULT NULL,
  `loai_san_pham` varchar(30) check (`loai_san_pham` in ('san_pham','workshop')) DEFAULT 'san_pham',
  `thoi_gian_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `thoi_gian_cap_nhat` datetime DEFAULT CURRENT_TIMESTAMP /* ON UPDATE CURRENT_TIMESTAMP */,
  PRIMARY KEY (`ma_san_pham`),
  KEY `ma_danh_muc` (`ma_danh_muc`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------
INSERT INTO `san_pham` (`ma_san_pham`, `ma_loai`, `ma_danh_muc`, `ten_san_pham`, `gia`, `mo_ta`, `hinh_anh_url`, `thoi_gian_tao`, `thoi_gian_cap_nhat`) VALUES
(12, 1, 1, 'Len Cotton Milk Premium', 45000.00, '', NULL, '2025-11-29 23:21:35', '2025-11-29 23:21:35'),
(13, 1, 1, 'Len Wool Premium', 80000.00, 'Len wool mềm mượt, thích hợp làm thú bông.', NULL, '2025-11-29 23:34:25', '2025-11-29 23:34:25');
--
-- SQLINES DEMO *** or table `san_pham_khuyen_mai`
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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `thanhpho`
--

DROP TABLE IF EXISTS `thanhpho`;
CREATE TABLE IF NOT EXISTS `thanhpho` (
  `ma_thanhpho` int NOT NULL AUTO_INCREMENT,
  `ten_thanhpho` varchar(100) NOT NULL,
  PRIMARY KEY (`ma_thanhpho`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `thanh_toan`
--

DROP TABLE IF EXISTS `thanh_toan`;
CREATE TABLE IF NOT EXISTS `thanh_toan` (
  `ma_thanh_toan` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL,
  `ma_don_hang` int DEFAULT NULL,
  `so_tien` decimal(10,2) DEFAULT NULL,
  `phuong_thuc` varchar(30) check (`phuong_thuc` in ('tien_mat','chuyen_khoan','momo')) DEFAULT 'tien_mat',
  `trang_thai` varchar(30) check (`trang_thai` in ('cho_xu_ly','thanh_cong','that_bai')) DEFAULT 'cho_xu_ly',
  `thoi_gian_thanh_toan` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_thanh_toan`),
  KEY `ma_nguoi_dung` (`ma_nguoi_dung`),
  KEY `ma_don_hang` (`ma_don_hang`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `ton_kho`
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
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO *** or table `workshop`
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
  CONSTRAINT `ma_san_pham` UNIQUE (`ma_san_pham`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
COMMIT;

/* SQLINES DEMO *** CTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/* SQLINES DEMO *** CTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/* SQLINES DEMO *** TION_CONNECTION=@OLD_COLLATION_CONNECTION */;
