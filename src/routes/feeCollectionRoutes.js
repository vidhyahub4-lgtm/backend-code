// const express = require("express");
// const router = express.Router();
// // const auth = require("../middlewares/auth"); // adjust to your auth middleware
// const authMiddleware = require("../middileware/auth");
// const feeController = require("../controllers/feeCollection_controller");
// const validateInstallmentMonth = require("../middileware/validateInstallmentMonth");
// // router.use(auth);

// // demands
// router.post("/demands/monthly",authMiddleware,validateInstallmentMonth, feeController.generateMonthlyDemands);

// //get student monthly payment detail and due
// router.get("/students/payment-detail-monthly", feeController.getMonthlyDues);

// // counter screen
// router.get("/students/:studentId/dues", authMiddleware, feeController.getStudentDues);
// router.get("/students/:studentId/admission-due", authMiddleware, feeController.getAdmissionDues);
// router.get("/students/:studentId/monthly-due", authMiddleware, feeController.getMonthlyDues);

// // payments
// router.post("/collect",authMiddleware, feeController.collectFee);

// // receipts
// router.get("/receipts", authMiddleware, feeController.listReceipts);
// router.get("/receipts/:receiptId", authMiddleware, feeController.getReceipt);
// router.post("/receipts/:receiptId/cancel", authMiddleware, feeController.cancelReceipt);

// module.exports = router;


const express = require("express");
const router = express.Router();
const authMiddleware = require("../middileware/auth");
const validateInstallmentMonth = require("../middileware/validateInstallmentMonth");
const feeController = require("../controllers/feeCollection_controller");
// const concessionController = require("../controllers/feeConcession_controller");

// demands
router.post(
  "/demands/monthly",
  authMiddleware,
  validateInstallmentMonth,
  feeController.generateMonthlyDemands,
);

// counter screen — separate admission due / monthly due
router.get(
  "/students/:studentId/admission-due",
  authMiddleware,
  feeController.getAdmissionDues,
);
router.get(
  "/students/:studentId/monthly-due",
  authMiddleware,
  feeController.getMonthlyDues,
);

// payments
router.post("/collect", authMiddleware, feeController.collectFee);

// receipts
router.get("/receipts", authMiddleware, feeController.listReceipts);
router.get("/receipts/:receiptId", authMiddleware, feeController.getReceipt);
router.post(
  "/receipts/:receiptId/cancel",
  authMiddleware,
  feeController.cancelReceipt,
);

// concessions
// router.post(
//   "/concessions/apply",
//   authMiddleware,
//   concessionController.applyConcession,
// );
// router.post(
//   "/concessions/:demandId/remove",
//   authMiddleware,
//   concessionController.removeConcession,
// );
// router.get(
//   "/students/:studentId/concession-history",
//   authMiddleware,
//   concessionController.getConcessionHistory,
// );

module.exports = router;