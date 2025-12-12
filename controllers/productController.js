const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../config/database');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').toLowerCase();
		const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, `${base}-${unique}${ext}`);
	}
});

// Multer instance để chấp nhận tất cả fields (dùng cho upload.any())
// Không dùng fileFilter để tránh conflict với unexpected fields
const uploadAny = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Giữ upload cũ để backward compatibility (có fileFilter cho các route khác)
const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: function (req, file, cb) {
		if (!file.mimetype.startsWith('image/')) {
			return cb(new Error('Chỉ hỗ trợ upload hình ảnh'), false);
		}
		cb(null, true);
	}
});

// Upload nhiều file cho biến thể
const uploadMultiple = multer({
	storage,
	fileFilter: function (req, file, cb) {
		if (!file.mimetype.startsWith('image/')) {
			return cb(new Error('Chỉ hỗ trợ upload hình ảnh'), false);
		}
		cb(null, true);
	}
});

function isAdmin(req) {
	return req.user && req.user.role === 'admin';
}

function buildImageUrl(req, imagePath) {
	if (!imagePath) return null;
	if (imagePath.startsWith('http')) return imagePath;
	const base = process.env.FILE_BASE_URL || `${req.protocol}://${req.get('host')}`;
	return `${base}${imagePath}`;
}

async function mapProduct(row, req) {
	// Lấy hình ảnh từ biến thể đầu tiên (nếu có)
	let imageList = [];
	let mainImagePath = row.imagePath;
	let mainImageUrl = buildImageUrl(req, row.imagePath);
	
	if (row.variants && Array.isArray(row.variants) && row.variants.length > 0) {
		const firstVariant = row.variants[0];
		// Ưu tiên lấy từ mảng images của biến thể
		if (firstVariant.images && Array.isArray(firstVariant.images) && firstVariant.images.length > 0) {
			imageList = firstVariant.images;
			mainImagePath = firstVariant.images[0].imagePath;
			mainImageUrl = firstVariant.images[0].imageUrl;
		} else if (firstVariant.imagePath) {
			// Fallback: dùng imagePath của biến thể
			imageList = [{
				imagePath: firstVariant.imagePath,
				imageUrl: firstVariant.imageUrl
			}];
			mainImagePath = firstVariant.imagePath;
			mainImageUrl = firstVariant.imageUrl;
		}
	} else if (row.imagePath) {
		// Nếu không có biến thể, dùng hình ảnh chính của sản phẩm
		imageList = [{
			imagePath: row.imagePath,
			imageUrl: buildImageUrl(req, row.imagePath)
		}];
	}

	return {
		id: row.id,
		name: row.name,
		price: Number(row.price) || 0,
		description: row.description || '',
		categoryId: row.categoryId,
		categoryName: row.categoryName || '',
		imagePath: mainImagePath || null,
		imageUrl: mainImageUrl,
		images: imageList,
		type: row.productType || '',
		createdAt: row.createdAt,
		variants: row.variants || []
	};
}

async function listProducts(req, res) {
	try {
		const { search, categoryId } = req.query;
        // Xây dựng câu truy vấn SQL động
        let sql = `SELECT sp.ma_san_pham AS id,
                        sp.ten_san_pham AS name,
                        sp.gia AS price,
                        sp.mo_ta AS description,
                        sp.hinh_anh_url AS imagePath,
                        lsp.ten_loai AS productType,
                        sp.ma_danh_muc AS categoryId,
                        dm.ten_danh_muc AS categoryName,
                        sp.thoi_gian_tao AS createdAt
                 FROM san_pham sp
                 LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
                 LEFT JOIN loai_san_pham lsp ON sp.ma_loai = lsp.ma_loai
                 WHERE 1=1`; // Mẹo: WHERE 1=1 để dễ dàng nối thêm AND
        const params = [];

		// Thêm điều kiện tìm kiếm theo tên
        if (search) {
            sql += ` AND sp.ten_san_pham LIKE ?`;
            params.push(`%${search}%`);
        }

        // Thêm điều kiện lọc theo danh mục
        if (categoryId) {
            sql += ` AND sp.ma_danh_muc = ?`;
            params.push(categoryId);
        }

		// Thêm sắp xếp
        sql += ` ORDER BY sp.thoi_gian_tao DESC`;
		
        // Thực thi truy vấn
        const [rows] = await pool.execute(sql, params);
		
		// Lấy biến thể và hình ảnh cho từng sản phẩm
		const productsWithVariants = await Promise.all(rows.map(async (row) => {
			try {
				// Lấy các biến thể của sản phẩm
				const [variants] = await pool.execute(
					`SELECT ma_bien_the AS id, mau_sac AS color, kich_co AS size, 
					        chat_lieu AS material, url_hinh_anh_bien_the AS imagePath, 
					        gia_them AS extraPrice
					 FROM bien_the_san_pham 
					 WHERE ma_san_pham = ?`,
					[row.id]
				);
				
				// Lấy nhiều hình ảnh cho mỗi biến thể từ bảng hinh_anh_bien_the
				const variantsWithImages = await Promise.all(variants.map(async (v) => {
					let variantImages = [];
					try {
						const [images] = await pool.execute(
							'SELECT url_hinh_anh AS imagePath, thu_tu AS imageOrder FROM hinh_anh_bien_the WHERE ma_bien_the = ? ORDER BY thu_tu ASC',
							[v.id]
						);
						variantImages = images.map(img => ({
							imagePath: img.imagePath,
							imageUrl: buildImageUrl(req, img.imagePath)
						}));
					} catch (err) {
						console.warn('Bảng hinh_anh_bien_the chưa tồn tại hoặc có lỗi:', err.message);
						// Fallback: dùng hình ảnh chính nếu có
						if (v.imagePath) {
							variantImages = [{
								imagePath: v.imagePath,
								imageUrl: buildImageUrl(req, v.imagePath)
							}];
						}
					}
					
					return {
						id: v.id,
						color: v.color,
						size: v.size,
						material: v.material,
						imagePath: v.imagePath,
						imageUrl: buildImageUrl(req, v.imagePath),
						images: variantImages.length > 0 ? variantImages : (v.imagePath ? [{ imagePath: v.imagePath, imageUrl: buildImageUrl(req, v.imagePath) }] : []),
						extraPrice: Number(v.extraPrice) || 0
					};
				}));
				
				row.variants = variantsWithImages;
			} catch (err) {
				console.warn('Lỗi khi lấy biến thể cho sản phẩm', row.id, ':', err.message);
				row.variants = [];
			}
			return await mapProduct(row, req);
		}));
		
		res.json({ status: 'success', products: productsWithVariants });
	} catch (err) {
		console.error('listProducts error:', err);
		res.status(500).json({ status: 'error', message: 'Không thể tải sản phẩm', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
	}
}

async function getProductById(req, res) {
	try {
		const { id } = req.params;
		// Query từ bảng san_pham (id là ma_san_pham)
		const [rows] = await pool.execute(
			`SELECT sp.ma_san_pham AS id,
			        sp.ten_san_pham AS name,
			        sp.gia AS price,
			        sp.mo_ta AS description,
			        sp.hinh_anh_url AS imagePath,
			        lsp.ten_loai AS productType,
			        sp.ma_danh_muc AS categoryId,
			        dm.ten_danh_muc AS categoryName,
			        sp.thoi_gian_tao AS createdAt
			 FROM san_pham sp
			 LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
			 LEFT JOIN loai_san_pham lsp ON sp.ma_loai = lsp.ma_loai
			 WHERE sp.ma_san_pham = ?`,
			[id]
		);
		if (!rows.length) return res.status(404).json({ status: 'error', message: 'Không tìm thấy sản phẩm' });
		
		// Lấy các biến thể của sản phẩm
		try {
			const [variants] = await pool.execute(
				`SELECT b.ma_bien_the AS id, b.mau_sac AS color, b.kich_co AS size, 
				        b.chat_lieu AS material, b.url_hinh_anh_bien_the AS imagePath, 
				        b.gia_them AS extraPrice,
				        COALESCE(t.so_luong_ton, 0) AS stock
				 FROM bien_the_san_pham b
				 LEFT JOIN ton_kho t ON b.ma_bien_the = t.ma_bien_the AND t.ma_kho = 1
				 WHERE b.ma_san_pham = ?`,
				[id]
			);
			
			// Lấy nhiều hình ảnh cho mỗi biến thể từ bảng hinh_anh_bien_the
			const variantsWithImages = await Promise.all(variants.map(async (v) => {
				let variantImages = [];
				try {
					const [images] = await pool.execute(
						'SELECT url_hinh_anh AS imagePath, thu_tu AS imageOrder FROM hinh_anh_bien_the WHERE ma_bien_the = ? ORDER BY thu_tu ASC',
						[v.id]
					);
					variantImages = images.map(img => ({
						imagePath: img.imagePath,
						imageUrl: buildImageUrl(req, img.imagePath)
					}));
				} catch (err) {
					console.warn('Bảng hinh_anh_bien_the chưa tồn tại hoặc có lỗi:', err.message);
					// Fallback: dùng hình ảnh chính nếu có
					if (v.imagePath) {
						variantImages = [{
							imagePath: v.imagePath,
							imageUrl: buildImageUrl(req, v.imagePath)
						}];
					}
				}
				
				return {
					id: v.id,
					color: v.color,
					size: v.size,
					material: v.material,
					imagePath: v.imagePath,
					imageUrl: buildImageUrl(req, v.imagePath),
					images: variantImages.length > 0 ? variantImages : (v.imagePath ? [{ imagePath: v.imagePath, imageUrl: buildImageUrl(req, v.imagePath) }] : []),
					extraPrice: Number(v.extraPrice) || 0,
					stock: v.stock
				};
			}));
			
			rows[0].variants = variantsWithImages;
		} catch (err) {
			console.warn('Lỗi khi lấy biến thể:', err.message);
			rows[0].variants = [];
		}
		
		res.json({ status: 'success', product: await mapProduct(rows[0], req) });
	} catch (err) {
		console.error('getProductById error:', err);
		res.status(500).json({ status: 'error', message: 'Không thể tải sản phẩm' });
	}
}

async function createProduct(req, res) {
	try {
		if (!isAdmin(req)) return res.status(403).json({ status: 'error', message: 'Forbidden' });

		// Debug: log request data
		console.log('createProduct - req.body:', req.body);
		console.log('createProduct - req.files:', req.files);
		console.log('createProduct - req.body type:', typeof req.body);
		console.log('createProduct - req.body keys:', req.body ? Object.keys(req.body) : 'req.body is null/undefined');

		// Đảm bảo req.body tồn tại
		if (!req.body) {
			return res.status(400).json({ status: 'error', message: 'Request body không hợp lệ' });
		}

		const { name, price, description, categoryId, productType, variants } = req.body;
		if (!name || !price) {
			return res.status(400).json({ 
				status: 'error', 
				message: 'Tên và giá sản phẩm là bắt buộc',
				received: { name: name || 'missing', price: price || 'missing' }
			});
		}

		const numericPrice = Number(price);
		if (Number.isNaN(numericPrice) || numericPrice < 0) {
			return res.status(400).json({ status: 'error', message: 'Giá sản phẩm không hợp lệ' });
		}

		const category = categoryId ? Number(categoryId) : null;
		// Xử lý file upload: với uploadAny.any(), req.files là array
		const allFiles = Array.isArray(req.files) ? req.files : [];
		const productImages = allFiles.filter(f => f.fieldname === 'productImages');
		const productImageUrls = req.body.productImageUrls ? (Array.isArray(req.body.productImageUrls) ? req.body.productImageUrls : [req.body.productImageUrls]) : [];
		
		// Lấy tất cả file variantImages với pattern variantImages_${variantIndex}_${imageIndex}
		const variantImagesMap = {};
		allFiles.forEach(file => {
			if (file.fieldname && file.fieldname.startsWith('variantImages_')) {
				const parts = file.fieldname.split('_');
				if (parts.length >= 3) {
					const variantIdx = parseInt(parts[1]);
					const imageIdx = parseInt(parts[2]);
					if (!variantImagesMap[variantIdx]) {
						variantImagesMap[variantIdx] = [];
					}
					variantImagesMap[variantIdx][imageIdx] = file;
				}
			}
		});
		// Lấy hình ảnh đầu tiên làm hình chính (backward compatibility)
		const mainImagePath = productImages.length > 0 ? `/uploads/${productImages[0].filename}` : (productImageUrls.length > 0 ? productImageUrls[0] : null);

		// Tìm ma_loai từ productType (ten_loai)
		let maLoai = null;
		if (productType) {
			try {
				const [loaiRows] = await pool.execute(
					`SELECT ma_loai FROM loai_san_pham WHERE ten_loai = ?`,
					[productType.trim()]
				);
				if (loaiRows.length > 0) {
					maLoai = loaiRows[0].ma_loai;
				} else {
					// Nếu không tìm thấy, tạo mới hoặc dùng default (ma_loai = 1 cho "Len")
					console.warn(`Không tìm thấy loại sản phẩm "${productType}", sử dụng mặc định (Len)`);
					maLoai = 1; // Default: Len
				}
			} catch (err) {
				console.error('Lỗi khi tìm loại sản phẩm:', err);
				maLoai = 1; // Default: Len
			}
		} else {
			maLoai = 1; // Default: Len
		}

		// Tạo sản phẩm
		const [result] = await pool.execute(
			`INSERT INTO san_pham (ma_danh_muc, ma_loai, ten_san_pham, gia, mo_ta, hinh_anh_url)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[
				category,
				maLoai,
				name.trim(),
				numericPrice,
				description || '',
				mainImagePath
			]
		);

		const productId = result.insertId;

		// Xử lý biến thể: lưu vào bảng bien_the_san_pham
		if (variants) {
			let variantsData;
			try {
				variantsData = typeof variants === 'string' ? JSON.parse(variants) : variants;
				console.log('Parsed variants:', variantsData);
			} catch (e) {
				console.warn('Lỗi parse variants:', e.message);
				console.warn('Variants raw:', variants);
				variantsData = [];
			}

			if (Array.isArray(variantsData) && variantsData.length > 0) {
				try {
					for (let i = 0; i < variantsData.length; i++) {
						const variant = variantsData[i];
						const variantFiles = variantImagesMap[i] || [];
						// Lấy file đầu tiên làm hình chính, hoặc URL đầu tiên
						const firstFile = variantFiles.find(f => f);
						const variantImagePath = firstFile ? `/uploads/${firstFile.filename}` : (variant.imageUrls && variant.imageUrls.length > 0 ? variant.imageUrls[0] : null);
						
						// Nếu không có hình ảnh, bỏ qua biến thể này
						if (!variantImagePath) {
							console.warn(`Biến thể ${i} không có hình ảnh, bỏ qua`);
							continue;
						}

						// Lưu biến thể vào bảng bien_the_san_pham
						const [variantResult] = await pool.execute(
							`INSERT INTO bien_the_san_pham (ma_san_pham, mau_sac, kich_co, chat_lieu, url_hinh_anh_bien_the, gia_them)
							 VALUES (?, ?, ?, ?, ?, ?)`,
							[
								productId,
								variant.color || '',
								variant.size || '',
								variant.material || '',
								variantImagePath,
								Number(variant.extraPrice) || 0
							]
						);
						
						const variantId = variantResult.insertId;

						// Lưu vào bảng ton_kho
						if (variant.stock !== undefined) {
							await pool.execute(
								`INSERT INTO ton_kho (ma_kho, ma_san_pham, ma_bien_the, so_luong_ton)
								VALUES (?, ?, ?, ?)`,
								[
									1,
									productId,
									variantId,
									Number(variant.stock) || 0
								]
							);
						}
						
						// Lưu nhiều hình ảnh cho biến thể vào bảng hinh_anh_bien_the
						try {
							// Lưu các file mới
							let imageOrder = 0;
							variantFiles.forEach((file, fileIdx) => {
								if (file) {
									const imagePath = `/uploads/${file.filename}`;
									pool.execute(
										'INSERT INTO hinh_anh_bien_the (ma_bien_the, url_hinh_anh, thu_tu) VALUES (?, ?, ?)',
										[variantId, imagePath, imageOrder++]
									).catch(err => {
										console.warn('Lỗi khi lưu hình ảnh variant file:', err.message);
									});
								}
							});
							
							// Lưu các URL cũ (nếu có)
							const variantImageUrls = variant.imageUrls || [];
							variantImageUrls.forEach((url, urlIdx) => {
								if (url && url.trim()) {
									pool.execute(
										'INSERT INTO hinh_anh_bien_the (ma_bien_the, url_hinh_anh, thu_tu) VALUES (?, ?, ?)',
										[variantId, url.trim(), imageOrder++]
									).catch(err => {
										console.warn('Lỗi khi lưu hình ảnh variant URL:', err.message);
									});
								}
							});
						} catch (err) {
							console.warn('Không thể lưu hình ảnh variant vào bảng hinh_anh_bien_the:', err.message);
						}
					}
				} catch (err) {
					console.error('Lỗi khi lưu biến thể:', err);
					// Không throw error, chỉ log để sản phẩm gốc vẫn được tạo
				}
			}
		}

		res.status(201).json({ status: 'success', id: productId });
	} catch (err) {
		console.error('createProduct error:', err);
		console.error('createProduct error stack:', err.stack);
		res.status(500).json({ 
			status: 'error', 
			message: 'Không thể tạo sản phẩm',
			error: process.env.NODE_ENV === 'development' ? err.message : undefined,
			stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
		});
	}
}

async function updateProduct(req, res) {
	try {
		if (!isAdmin(req)) return res.status(403).json({ status: 'error', message: 'Forbidden' });

		const { id } = req.params;
		const { name, price, description, categoryId, productType, variants } = req.body;
		const [rows] = await pool.execute('SELECT * FROM san_pham WHERE ma_san_pham = ?', [id]);
		if (!rows.length) return res.status(404).json({ status: 'error', message: 'Không tìm thấy sản phẩm' });

		const current = rows[0];
		let numericPrice = current.gia;
		if (typeof price !== 'undefined') {
			const parsed = Number(price);
			if (Number.isNaN(parsed) || parsed < 0) {
				return res.status(400).json({ status: 'error', message: 'Giá sản phẩm không hợp lệ' });
			}
			numericPrice = parsed;
		}

		// Xử lý hình ảnh sản phẩm: với uploadAny.any(), req.files là array
		const allFiles = Array.isArray(req.files) ? req.files : [];
		const productImages = allFiles.filter(f => f.fieldname === 'productImages');
		const productImageUrls = req.body.productImageUrls ? (Array.isArray(req.body.productImageUrls) ? req.body.productImageUrls : [req.body.productImageUrls]) : [];
		
		// Lấy tất cả file variantImages với pattern variantImages_${variantIndex}_${imageIndex}
		const variantImagesMap = {};
		allFiles.forEach(file => {
			if (file.fieldname && file.fieldname.startsWith('variantImages_')) {
				const parts = file.fieldname.split('_');
				if (parts.length >= 3) {
					const variantIdx = parseInt(parts[1]);
					const imageIdx = parseInt(parts[2]);
					if (!variantImagesMap[variantIdx]) {
						variantImagesMap[variantIdx] = [];
					}
					variantImagesMap[variantIdx][imageIdx] = file;
				}
			}
		});
		
		// Cập nhật hình ảnh chính
		let imagePath = current.hinh_anh_url;
		if (productImages.length > 0) {
			imagePath = `/uploads/${productImages[0].filename}`;
		} else if (productImageUrls.length > 0) {
			imagePath = productImageUrls[0];
		}

		// Tìm ma_loai từ productType (ten_loai) nếu có
		let maLoai = current.ma_loai; // Giữ nguyên nếu không có productType mới
		if (typeof productType !== 'undefined' && productType !== null) {
			try {
				const [loaiRows] = await pool.execute(
					`SELECT ma_loai FROM loai_san_pham WHERE ten_loai = ?`,
					[productType.trim()]
				);
				if (loaiRows.length > 0) {
					maLoai = loaiRows[0].ma_loai;
				} else {
					console.warn(`Không tìm thấy loại sản phẩm "${productType}", giữ nguyên loại cũ`);
				}
			} catch (err) {
				console.error('Lỗi khi tìm loại sản phẩm:', err);
			}
		}

		await pool.execute(
			`UPDATE san_pham SET
			 ma_danh_muc = COALESCE(?, ma_danh_muc),
			 ma_loai = COALESCE(?, ma_loai),
			 ten_san_pham = COALESCE(?, ten_san_pham),
			 gia = ?,
			 mo_ta = COALESCE(?, mo_ta),
			 hinh_anh_url = ?
			 WHERE ma_san_pham = ?`,
			[
				typeof categoryId !== 'undefined' ? (categoryId ? Number(categoryId) : null) : null,
				typeof productType !== 'undefined' ? maLoai : null,
				typeof name !== 'undefined' ? name.trim() : null,
				numericPrice,
				typeof description !== 'undefined' ? description : null,
				imagePath,
				id
			]
		);

		// Xử lý cập nhật biến thể: lưu vào bảng bien_the_san_pham
		if (variants !== undefined) {
			// Xóa tất cả biến thể cũ và hình ảnh của chúng
			const [oldVariants] = await pool.execute(
				'SELECT ma_bien_the, url_hinh_anh_bien_the FROM bien_the_san_pham WHERE ma_san_pham = ?',
				[id]
			);
			
			// Xóa hình ảnh của biến thể cũ từ bảng hinh_anh_bien_the
			for (const oldVariant of oldVariants) {
				try {
					const [oldVariantImages] = await pool.execute(
						'SELECT url_hinh_anh FROM hinh_anh_bien_the WHERE ma_bien_the = ?',
						[oldVariant.ma_bien_the]
					);
					await pool.execute('DELETE FROM hinh_anh_bien_the WHERE ma_bien_the = ?', [oldVariant.ma_bien_the]);
					
					// Xóa file ảnh cũ
					oldVariantImages.forEach(img => {
						if (img.url_hinh_anh && img.url_hinh_anh.startsWith('/uploads/')) {
							const filePath = path.join(__dirname, '..', img.url_hinh_anh);
							// fs.unlink(filePath, () => {});
						}
					});
				} catch (err) {
					console.warn('Bảng hinh_anh_bien_the chưa tồn tại, bỏ qua:', err.message);
				}
				
				// Xóa file ảnh chính của biến thể
				if (oldVariant.url_hinh_anh_bien_the && oldVariant.url_hinh_anh_bien_the.startsWith('/uploads/')) {
					const oldPath = path.join(__dirname, '..', oldVariant.url_hinh_anh_bien_the);
					// fs.unlink(oldPath, () => {});
				}
			}
			
			// Xóa tồn kho của sản phẩm trước
			await pool.execute('DELETE FROM ton_kho WHERE ma_san_pham = ?', [id]);
			
			await pool.execute('DELETE FROM bien_the_san_pham WHERE ma_san_pham = ?', [id]);
			
			let variantsData;
			try {
				variantsData = typeof variants === 'string' ? JSON.parse(variants) : variants;
			} catch (e) {
				variantsData = [];
			}

			if (Array.isArray(variantsData) && variantsData.length > 0) {
				for (let i = 0; i < variantsData.length; i++) {
					const variant = variantsData[i];
					const variantFiles = variantImagesMap[i] || [];
					// Lấy file đầu tiên làm hình chính, hoặc URL đầu tiên
					const firstFile = variantFiles.find(f => f);
					const variantImagePath = firstFile ? `/uploads/${firstFile.filename}` : (variant.imageUrls && variant.imageUrls.length > 0 ? variant.imageUrls[0] : null);
					
					// Nếu không có hình ảnh, bỏ qua biến thể này
					if (!variantImagePath) {
						console.warn(`Biến thể ${i} không có hình ảnh, bỏ qua`);
						continue;
					}

					// Lưu biến thể vào bảng bien_the_san_pham
					const [variantResult] = await pool.execute(
						`INSERT INTO bien_the_san_pham (ma_san_pham, mau_sac, kich_co, chat_lieu, url_hinh_anh_bien_the, gia_them)
						 VALUES (?, ?, ?, ?, ?, ?)`,
						[
							id,
							variant.color || '',
							variant.size || '',
							variant.material || '',
							variantImagePath,
							Number(variant.extraPrice) || 0
						]
					);
					
					const variantId = variantResult.insertId;

					// Lưu vào bảng ton_kho
					if (variant.stock !== undefined) {
						await pool.execute(
							`INSERT INTO ton_kho (ma_kho, ma_san_pham, ma_bien_the, so_luong_ton)
							VALUES (?, ?, ?, ?)`,
							[
								1,
								id,
								variantId,
								Number(variant.stock) || 0
							]
						);
					}
					
					// Lưu nhiều hình ảnh cho biến thể vào bảng hinh_anh_bien_the
					try {
						// Lưu các file mới
						let imageOrder = 0;
						variantFiles.forEach((file, fileIdx) => {
							if (file) {
								const imagePath = `/uploads/${file.filename}`;
								pool.execute(
									'INSERT INTO hinh_anh_bien_the (ma_bien_the, url_hinh_anh, thu_tu) VALUES (?, ?, ?)',
									[variantId, imagePath, imageOrder++]
								).catch(err => {
									console.warn('Lỗi khi lưu hình ảnh variant file:', err.message);
								});
							}
						});
						
						// Lưu các URL cũ (nếu có)
						const variantImageUrls = variant.imageUrls || [];
						variantImageUrls.forEach((url, urlIdx) => {
							if (url && url.trim()) {
								pool.execute(
									'INSERT INTO hinh_anh_bien_the (ma_bien_the, url_hinh_anh, thu_tu) VALUES (?, ?, ?)',
									[variantId, url.trim(), imageOrder++]
								).catch(err => {
									console.warn('Lỗi khi lưu hình ảnh variant URL:', err.message);
								});
							}
						});
					} catch (err) {
						console.warn('Không thể lưu hình ảnh variant vào bảng hinh_anh_bien_the:', err.message);
					}
				}
			}
		}

		res.json({ status: 'success', message: 'Cập nhật sản phẩm thành công' });
	} catch (err) {
		console.error('updateProduct error:', err);
		res.status(500).json({ status: 'error', message: 'Không thể cập nhật sản phẩm' });
	}
}

async function deleteProduct(req, res) {
	try {
		if (!isAdmin(req)) return res.status(403).json({ status: 'error', message: 'Forbidden' });
		const { id } = req.params;
		const [rows] = await pool.execute('SELECT hinh_anh_url FROM san_pham WHERE ma_san_pham = ?', [id]);
		if (!rows.length) return res.status(404).json({ status: 'error', message: 'Không tìm thấy sản phẩm' });

		// Lấy danh sách biến thể để xóa hình ảnh
		const [variants] = await pool.execute(
			'SELECT ma_bien_the, url_hinh_anh_bien_the FROM bien_the_san_pham WHERE ma_san_pham = ?',
			[id]
		);

		// Xóa hình ảnh của biến thể từ bảng hinh_anh_bien_the
		for (const variant of variants) {
			try {
				const [variantImages] = await pool.execute(
					'SELECT url_hinh_anh FROM hinh_anh_bien_the WHERE ma_bien_the = ?',
					[variant.ma_bien_the]
				);
				await pool.execute('DELETE FROM hinh_anh_bien_the WHERE ma_bien_the = ?', [variant.ma_bien_the]);
				
				// Xóa file ảnh biến thể
				variantImages.forEach(img => {
					if (img.url_hinh_anh && img.url_hinh_anh.startsWith('/uploads/')) {
						const filePath = path.join(__dirname, '..', img.url_hinh_anh);
						fs.unlink(filePath, () => {});
					}
				});
			} catch (err) {
				console.warn('Bảng hinh_anh_bien_the chưa tồn tại, bỏ qua:', err.message);
			}
			
			// Xóa file ảnh chính của biến thể
			if (variant.url_hinh_anh_bien_the && variant.url_hinh_anh_bien_the.startsWith('/uploads/')) {
				const variantFilePath = path.join(__dirname, '..', variant.url_hinh_anh_bien_the);
				fs.unlink(variantFilePath, () => {});
			}
		}
		
		// Xóa tồn kho của sản phẩm trước
		await pool.execute('DELETE FROM ton_kho WHERE ma_san_pham = ?', [id]);
		
		// Xóa biến thể trước (do foreign key constraint)
		await pool.execute('DELETE FROM bien_the_san_pham WHERE ma_san_pham = ?', [id]);
		
		// Xóa sản phẩm
		await pool.execute('DELETE FROM san_pham WHERE ma_san_pham = ?', [id]);

		// Xóa file ảnh chính của sản phẩm
		if (rows[0].hinh_anh_url && rows[0].hinh_anh_url.startsWith('/uploads/')) {
			const mainImagePath = path.join(__dirname, '..', rows[0].hinh_anh_url);
			fs.unlink(mainImagePath, () => {});
		}

		res.json({ status: 'success', message: 'Đã xóa sản phẩm' });
	} catch (err) {
		console.error('deleteProduct error:', err);
		res.status(500).json({ status: 'error', message: 'Không thể xóa sản phẩm' });
	}
}

module.exports = {
	upload,
	uploadAny,
	uploadMultiple,
	listProducts,
	getProductById,
	createProduct,
	updateProduct,
	deleteProduct
};

