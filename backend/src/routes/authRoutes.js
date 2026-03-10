const express = require('express');
const router = express.Router();
const { login, changePassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', login);
router.post('/change-password', requireAuth, changePassword);

module.exports = router;
