const fs = require("fs");
const path = require("path");
const multer = require("multer");
const AppError = require("../utils/AppError");

const AVATAR_DIR = path.resolve(__dirname, "../../uploads/avatars");
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, AVATAR_DIR),
    filename: (req, file, cb) => {
        const ext = ALLOWED_MIME_TYPES[file.mimetype] || path.extname(file.originalname);
        cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
        return cb(new AppError("Only JPEG, PNG, or WEBP images are allowed", 400));
    }
    cb(null, true);
};

const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
}).single("avatar");

module.exports = { uploadAvatar, AVATAR_DIR };
