const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { loginSchema, updateProfileSchema, changePasswordSchema } = require("../validators/authValidators");
const { loginLimiter } = require("../middleware/rateLimiters");
const { uploadAvatar } = require("../middleware/uploadAvatar");

const router = express.Router();

router.post("/login", loginLimiter, validate(loginSchema), authController.login);
router.get("/me", authMiddleware, authController.me);
router.put("/me", authMiddleware, validate(updateProfileSchema), authController.updateMe);
router.put(
    "/password",
    authMiddleware,
    validate(changePasswordSchema),
    authController.changePassword
);
router.post("/avatar", authMiddleware, uploadAvatar, authController.uploadAvatar);

module.exports = router;
