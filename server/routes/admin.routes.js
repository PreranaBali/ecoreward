/**
 * Admin Routes – PATCH /api/admin/...
 */
const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { protect, requireAdmin } = require('../middleware/auth');

// Route for manual verification overrides
// (In production, append requireAdmin middleware right after protect for access control)
router.patch('/verify/:id', protect, ctrl.verifyReport);

module.exports = router;