const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const {
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
} = require('../controllers/userController');

router.use(verifyToken);

// profile endpoints (endpoint cho bất kỳ người dùng đã xác thực nào)
router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUser);
router.put('/me/password', updateUserPassword);
router.post('/me/avatar', uploadAvatar.single('avatar'), uploadUserAvatar);
router.get('/me/cart-quantity', CountQuantityCart);

// admin-only routes (kiểm tra xem người dùng có phải là admin không)
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
