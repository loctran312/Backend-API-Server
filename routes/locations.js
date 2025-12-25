const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/cities', locationController.getCities);

router.get('/wards/:cityId', locationController.getWards);

module.exports = router;
