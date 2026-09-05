const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const AppError = require("../utils/AppError");

const ALLOWED_MIME_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
        folder: "doctor-tracker/avatars",
        public_id: `user-${req.user.id}-${Date.now()}`,
        format: ALLOWED_MIME_TYPES[file.mimetype],
        resource_type: "image",
    }),
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

module.exports = { uploadAvatar };
