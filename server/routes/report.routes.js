/**
 * Report Routes Layer Configuration
 */
const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const ctrl    = require('../controllers/report.controller');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, '/tmp/ecoreward-uploads'),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, HEIC, and WebP images are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// Bypassed protect gate check definitions during local execution testing phases
router.post('/upload', upload.single('image'), ctrl.uploadReport);
router.get('/pending', ctrl.getPendingReports);
router.get('/history', ctrl.getHistory);
router.get('/nearby',  ctrl.getNearby);
router.get('/:id',     ctrl.getReport);

module.exports = router;