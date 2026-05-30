const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDirPhotos = path.join(__dirname, "../uploads/candidates/photos");
const uploadDirDocs = path.join(__dirname, "../uploads/candidates/documents");
if (!fs.existsSync(uploadDirPhotos)) {
  fs.mkdirSync(uploadDirPhotos, { recursive: true });
}
if (!fs.existsSync(uploadDirDocs)) {
  fs.mkdirSync(uploadDirDocs, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'documents') {
      cb(null, uploadDirDocs);
    } else {
      cb(null, uploadDirPhotos);
    }
  },
  filename: function (req, file, cb) {
    // Unique filename: fieldname-timestamp-random.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

// File filter to accept images and documents
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  const allowedDocTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  
  if (file.fieldname === 'documents') {
    if (allowedImageTypes.includes(file.mimetype) || allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type for document. Allowed: PDF, DOC, DOCX, JPG, PNG."), false);
    }
  } else {
    // For photo or gallery
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP images are allowed."), false);
    }
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;
