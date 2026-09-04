const express = require("express");
const doctorController = require("../controllers/doctorController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
    createDoctorSchema,
    updateDoctorSchema,
    idParamSchema,
} = require("../validators/doctorValidators");

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate(createDoctorSchema), doctorController.create);
router.get("/", doctorController.list);
router.get("/:id", validate(idParamSchema, "params"), doctorController.getOne);
router.get(
    "/:id/patients",
    validate(idParamSchema, "params"),
    doctorController.getPatients
);
router.put(
    "/:id",
    validate(idParamSchema, "params"),
    validate(updateDoctorSchema),
    doctorController.update
);
router.delete("/:id", validate(idParamSchema, "params"), doctorController.remove);

module.exports = router;
