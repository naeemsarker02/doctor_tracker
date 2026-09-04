const express = require("express");
const appointmentController = require("../controllers/appointmentController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
    createAppointmentSchema,
    updateAppointmentSchema,
    idParamSchema,
} = require("../validators/appointmentValidators");

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate(createAppointmentSchema), appointmentController.create);
router.get("/", appointmentController.list);
router.get("/:id", validate(idParamSchema, "params"), appointmentController.getOne);
router.put(
    "/:id",
    validate(idParamSchema, "params"),
    validate(updateAppointmentSchema),
    appointmentController.update
);
router.delete("/:id", validate(idParamSchema, "params"), appointmentController.remove);

module.exports = router;
