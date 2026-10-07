const express = require("express");
const router = express.Router();
// const auth = require("../middlewares/auth"); // adjust to your auth middleware
const authMiddleware = require("../middileware/auth");
const feeController = require("../controllers/feeCollection_controller");
const validateInstallmentMonth = require("../middileware/validateInstallmentMonth");
// router.use(auth);

// demands
router.post("/demands/monthly",authMiddleware,validateInstallmentMonth, feeController.generateMonthlyDemands);

// counter screen
router.get("/students/:studentId/dues", authMiddleware, feeController.getStudentDues);
router.get("/students/:studentId/admission-due", authMiddleware, feeController.getAdmissionDues);
router.get("/students/:studentId/monthly-due", authMiddleware, feeController.getMonthlyDues);

// payments
router.post("/collect",authMiddleware, feeController.collectFee);

// receipts
router.get("/receipts", authMiddleware, feeController.listReceipts);
router.get("/receipts/:receiptId", authMiddleware, feeController.getReceipt);
router.post("/receipts/:receiptId/cancel", authMiddleware, feeController.cancelReceipt);

module.exports = router;