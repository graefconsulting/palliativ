const express = require('express');
const router = express.Router();
const { getHolidays } = require('../controllers/holidaysController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getHolidays);

module.exports = router;
