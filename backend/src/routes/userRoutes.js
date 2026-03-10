const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, deactivateUser } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Nur Admin und Leitung dürfen Benutzer sehen
router.get('/', requireAuth, requireRole(['admin', 'leitung']), getAllUsers);

// Nur Admin darf neue Benutzer erstellen, aktualisieren und deaktivieren
router.post('/', requireAuth, requireRole(['admin']), createUser);
router.put('/:id', requireAuth, requireRole(['admin', 'leitung']), updateUser); // Leitung darf aktualisieren laut Spec
router.put('/:id/deactivate', requireAuth, requireRole(['admin']), deactivateUser);

module.exports = router;
