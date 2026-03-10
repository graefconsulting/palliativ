const express = require('express');
const router = express.Router();
const {
    getTimeTrackings,
    getOvertimeSummary,
    createTimeTracking,
    updateTimeTrackingStatus,
    deleteTimeTracking
} = require('../controllers/timeController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, getTimeTrackings);
router.get('/summary', requireAuth, getOvertimeSummary);
router.post('/', requireAuth, createTimeTracking);
router.put('/:id/status', requireAuth, requireRole(['admin', 'leitung']), updateTimeTrackingStatus);
router.delete('/:id', requireAuth, deleteTimeTracking);

module.exports = router;
