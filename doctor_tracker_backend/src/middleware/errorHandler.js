const AppError = require("../utils/AppError");

const notFoundHandler = (req, res, next) => {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (error, req, res, next) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            ...(error.errors ? { errors: error.errors } : {}),
        });
    }

    if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.errors.map((e) => ({
                field: e.path,
                message: e.message,
            })),
        });
    }

    console.error("Unexpected error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};

module.exports = { notFoundHandler, errorHandler };
