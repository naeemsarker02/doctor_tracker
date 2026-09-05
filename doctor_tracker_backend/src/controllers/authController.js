const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const authService = require("../services/authService");
const AppError = require("../utils/AppError");

// Matches ".../upload/v<version>/<public_id>.<ext>" and captures the public_id
// (including any folder prefix, e.g. "doctor-tracker/avatars/user-1-169...").
const CLOUDINARY_PUBLIC_ID_PATTERN = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;

const extractCloudinaryPublicId = (url) => {
    const match = url.match(CLOUDINARY_PUBLIC_ID_PATTERN);
    return match ? match[1] : null;
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await authService.loginUser(
            email,
            password
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const me = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user.id);

        res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

const updateMe = async (req, res, next) => {
    try {
        const user = await authService.updateProfile(req.user.id, req.body);

        res.status(200).json({
            success: true,
            message: "Profile updated",
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        await authService.changePassword(req.user.id, req.body);

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        next(error);
    }
};

const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError("No image file was uploaded", 400);
        }

        const previousUser = await authService.getUserById(req.user.id);
        const previousAvatarUrl = previousUser.avatarUrl;

        // multer-storage-cloudinary sets `path` to the uploaded asset's secure_url.
        const avatarUrl = req.file.path;
        const user = await authService.updateAvatar(req.user.id, avatarUrl);

        if (previousAvatarUrl?.startsWith("/uploads/avatars/")) {
            // Legacy local-disk avatar from before the Cloudinary migration.
            const previousPath = path.resolve(
                __dirname,
                "../../",
                previousAvatarUrl.replace(/^\//, "")
            );
            fs.unlink(previousPath, () => {});
        } else if (previousAvatarUrl?.includes("res.cloudinary.com")) {
            const publicId = extractCloudinaryPublicId(previousAvatarUrl);
            if (publicId) {
                cloudinary.uploader.destroy(publicId).catch(() => {});
            }
        }

        res.status(200).json({
            success: true,
            message: "Avatar updated",
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    me,
    updateMe,
    changePassword,
    uploadAvatar,
};
