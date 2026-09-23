const express = require("express");
const router = express.Router();
// const auth = require("../middlewares/auth"); // adjust to your auth middleware
const authMiddleware = require("../middileware/auth");
const feeController = require("../controllers/feeCollection_controller");

// router.use(auth);

// demands
router.post("/demands/monthly",authMiddleware, feeController.generateMonthlyDemands);

// counter screen
router.get("/students/:studentId/dues", feeController.getStudentDues);

// payments
router.post("/collect", feeController.collectFee);

// receipts
router.get("/receipts", feeController.listReceipts);
router.get("/receipts/:receiptId", feeController.getReceipt);
router.post("/receipts/:receiptId/cancel", feeController.cancelReceipt);

module.exports = router;