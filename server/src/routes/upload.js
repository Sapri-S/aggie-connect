const router     = require('express').Router();
const multer     = require('multer');
const auth       = require('../middleware/auth');
const controller = require('../controllers/uploadController');

// Use memory storage since we're sending directly to Supabase
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

router.post('/photo', auth, upload.single('photo'), controller.uploadPhoto);

module.exports = router;