/**
 * Auth Routes – POST /api/auth/...
 */
const router  = require('express').Router();
const ctrl    = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register',         ctrl.register);
router.post('/login',            ctrl.login);
router.get('/profile',  protect, ctrl.getProfile);
router.patch('/profile', protect, ctrl.updateProfile);
router.post('/forgot-password',  ctrl.forgotPassword);

module.exports = router;
