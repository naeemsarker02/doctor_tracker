const express = require("express");
const patientController = require("../controllers/patientController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
    createPatientSchema,
    updatePatientSchema,
    idParamSchema,
} = require("../validators/patientValidators");

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate(createPatientSchema), patientController.create);
router.get("/", patientController.list);
router.get("/:id", validate(idParamSchema, "params"), patientController.getOne);
router.put(
    "/:id",
    validate(idParamSchema, "params"),
    validate(updatePatientSchema),
    patientController.update
);
router.delete("/:id", validate(idParamSchema, "params"), patientController.remove);

module.exports = router;
