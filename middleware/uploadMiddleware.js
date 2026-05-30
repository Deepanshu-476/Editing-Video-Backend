const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'uploads', 'portfolio');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|gif|mp4|mov|avi|webm)$/i;
  const hasAllowedExtension = allowedExtensions.test(file.originalname);
  const hasAllowedMimeType = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');

  if (hasAllowedExtension && hasAllowedMimeType) {
    return cb(null, true);
  }

  cb(new Error('Only images and videos allowed'));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter
});

module.exports = upload;
