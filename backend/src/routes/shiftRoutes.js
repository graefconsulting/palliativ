const express = require('express');
const router = express.Router();
const { getShifts, createShift, updateShift, deleteShift, getOnCallReport, getIllnessReport } = require('../controllers/shiftController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Berichte
router.get('/reports/oncall', requireAuth, requireRole(['admin', 'leitung']), getOnCallReport);
router.get('/reports/illness', requireAuth, requireRole(['admin', 'leitung']), getIllnessReport);

// Alle eingeloggten Nutzer dürfen Schichten lesen
router.get('/', requireAuth, getShifts);

// Nur Admin darf Schichten erstellen, bearbeiten und löschen
router.post('/', requireAuth, requireRole(['admin']), createShift);
router.put('/:id', requireAuth, requireRole(['admin']), updateShift);
router.delete('/:id', requireAuth, requireRole(['admin']), deleteShift);

module.exports = router;
