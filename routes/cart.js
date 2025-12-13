const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { verifyToken } = require('../controllers/authController');

router.use(verifyToken);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.post('/merge', cartController.mergeCart);
router.post('/update', cartController.updateCartItem);
router.post('/remove', cartController.removeCartItem);

module.exports = router;