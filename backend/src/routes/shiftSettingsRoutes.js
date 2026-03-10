const express = require('express');
const router = express.Router();
const { getShiftSettings, createShiftSetting, updateShiftSetting, deleteShiftSetting } = require('../controllers/shiftSettingsController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, getShiftSettings);
router.post('/', requireAuth, requireRole(['admin', 'leitung']), createShiftSetting);
router.put('/:id', requireAuth, requireRole(['admin', 'leitung']), updateShiftSetting);
router.delete('/:id', requireAuth, requireRole(['admin', 'leitung']), deleteShiftSetting);

module.exports = router;
