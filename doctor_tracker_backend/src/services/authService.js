const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const AppError = require("../utils/AppError");

const loginUser = async (email, password) => {
    const user = await User.findOne({
        where: { email },
    });

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", 401);
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        }
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
        },
        token,
    };
};

const getUserById = async (id) => {
    const user = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return user;
};

const updateProfile = async (id, { name, email }) => {
    const user = await getUserById(id);

    if (email && email !== user.email) {
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            throw new AppError("Email is already in use", 409);
        }
    }

    await user.update({
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
    });

    return user;
};

const changePassword = async (id, { currentPassword, newPassword }) => {
    const user = await User.findByPk(id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentValid) {
        throw new AppError("Current password is incorrect", 400);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });
};

const updateAvatar = async (id, avatarUrl) => {
    const user = await getUserById(id);
    await user.update({ avatarUrl });
    return user;
};

module.exports = {
    loginUser,
    getUserById,
    updateProfile,
    changePassword,
    updateAvatar,
};
