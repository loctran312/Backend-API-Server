const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');

router.use(verifyToken);

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
