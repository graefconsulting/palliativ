const express = require('express');
const router = express.Router();
const {
    getVacationRequests,
    createVacationRequest,
    updateVacationRequestStatus,
    deleteVacationRequest,
    getAvailabilityRequests,
    createAvailabilityRequest,
    deleteAvailabilityRequest
} = require('../controllers/requestController');
const { requireAuth, requireRole } = require('../middleware/auth');

// --- Vacation Requests ---
router.get('/vacation', requireAuth, getVacationRequests);
router.post('/vacation', requireAuth, createVacationRequest);
router.put('/vacation/:id/status', requireAuth, requireRole(['admin', 'leitung']), updateVacationRequestStatus);
router.delete('/vacation/:id', requireAuth, deleteVacationRequest);

// --- Availability Requests ---
router.get('/availability', requireAuth, getAvailabilityRequests);
router.post('/availability', requireAuth, createAvailabilityRequest);
router.delete('/availability/:id', requireAuth, deleteAvailabilityRequest);

module.exports = router;
