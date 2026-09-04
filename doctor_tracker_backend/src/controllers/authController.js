const fs = require("fs");
const path = require("path");
const authService = require("../services/authService");
const AppError = require("../utils/AppError");

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

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await authService.updateAvatar(req.user.id, avatarUrl);

        if (previousAvatarUrl && previousAvatarUrl.startsWith("/uploads/avatars/")) {
            const previousPath = path.resolve(
                __dirname,
                "../../",
                previousAvatarUrl.replace(/^\//, "")
            );
            fs.unlink(previousPath, () => {});
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
