const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Explicit MIME type allowlist — no substring matching
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpeg', '.jpg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.baseUrl.includes('profile') ? 'profiles' : 'proposals';
    cb(null, `uploads/${uploadType}/`);
  },
  filename: (req, file, cb) => {
    // Use a random name — never expose or reuse the original filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Both MIME type and extension must be in the allowlist
  if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
    return cb(null, true);
  }

  cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, DOCX, XLS, XLSX are allowed.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter,
});

module.exports = { upload };
