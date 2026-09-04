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

module.exports = {
    loginUser,
    getUserById,
};