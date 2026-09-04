const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { loginSchema } = require("../validators/authValidators");
const { loginLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/login", loginLimiter, validate(loginSchema), authController.login);
router.get("/me", authMiddleware, authController.me);

module.exports = router;
