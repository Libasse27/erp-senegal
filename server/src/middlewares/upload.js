const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Filtre par type de fichier
const fileFilter = (_req, file, cb) => {
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedDocs = /pdf|doc|docx|xls|xlsx|csv/;

  const extname =
    allowedImages.test(path.extname(file.originalname).toLowerCase()) ||
    allowedDocs.test(path.extname(file.originalname).toLowerCase());

  const mimetype =
    allowedImages.test(file.mimetype) ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'text/csv';

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new AppError('Type de fichier non autorise.', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
  },
});

// Middlewares pre-configures
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

module.exports = { upload, uploadSingle, uploadMultiple };
