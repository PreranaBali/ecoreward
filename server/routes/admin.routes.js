const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');

router.get('/reports', ctrl.listReports);

router.patch('/verify/:id', ctrl.verifyReport);

router.delete('/report/:id', ctrl.deleteReport);

router.get('/stats', ctrl.getStats);

router.get('/users', ctrl.listUsers);

module.exports = router;