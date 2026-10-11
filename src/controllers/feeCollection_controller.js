// const asyncHandler = require("../errorHandlers/asyncHandler");
// const AppError = require("../utils/appError");
// const feeDemandService = require("../services/feeService");
// const feeCollectionService = require("../services/feeCollectionService");

// module.exports = {
//   // POST /api/fees/demands/monthly
//   // Generates demands for EVERY instalment month defined for each class
//   // in SchoolPayModeSetup — no month is picked by the frontend.
//   // generateMonthlyDemands: asyncHandler(async (req, res) => {
//   //   const { session, classID, schId, installmentMonthId, installmentMonthNo } =
//   //     req.body;

//   //   if (!session || !installmentMonthId || !installmentMonthNo) {
//   //     throw new AppError("session, installmentMonthId, installmentMonthNo are required", 400);
//   //   }
    
//   //   const data = await feeDemandService.generateMonthlyDemands({
//   //     schId, // from the logged-in user, never from the body
//   //     userId: req.user?._id,
//   //     session,
//   //     classID,
//   //     installmentMonthId,
//   //     installmentMonthNo,
//   //   });

//   //   res.status(200).json({
//   //     success: true,
//   //     message: "Monthly fee demands generated",
//   //     data,
//   //   });
//   // }),

//    generateMonthlyDemands: asyncHandler(async (req, res) => {
//     const { schId, session, resolvedInstallments, missingClasses } =
//       req.feeDemandContext;
//       console.log(schId, session, resolvedInstallments, missingClasses)
 
//     const data = await feeDemandService.generateMonthlyDemands({
//       schId,
//       session,
//       userId: req.user._id,
//       resolvedInstallments,
//     });
 
//     res.status(200).json({
//       success: true,
//       message: "Monthly fee demands generated",
//       data: {
//         ...data,
//         notConfiguredForThisMonth: missingClasses,
//       },
//     });
//   }),

//   // GET /api/fees/students/:studentId/dues?session=
//   getStudentDues: asyncHandler(async (req, res) => {
//     const { session,schId } = req.query;
//     if (!session) throw new AppError("session is required", 400);

//     const data = await feeCollectionService.getStudentDues({
//       schId,
//       studentId: req.params.studentId,
//       session,
//     });

//     res.status(200).json({ success: true, data });
//   }),

//   getStudentPaymentDetail: asyncHandler(async (req, res) => {
//     const { session,schId,studentId } = req.query;
//     if (!studentId) throw new AppError("studentId is required", 400);
//     const result = await feeCollectionService.getStudentPaymentDetail({
//       schId,
//       studentId,
//       session,
//     });
//     res.status(200).json({ success: true, data: result });
//   }),


//   // GET /api/fees/students/:studentId/admission-due?session=
//   getAdmissionDues: asyncHandler(async (req, res) => {
//     const { session,schId } = req.query;
//     if (!session) throw new AppError("session is required", 400);
 
//     const data = await feeCollectionService.getAdmissionDues({
//       schId,
//       studentId: req.params.studentId,
//       session,
//     });
 
//     res.status(200).json({ success: true, data });
//   }),
 
//   // GET /api/fees/students/:studentId/monthly-due?session=
//   getMonthlyDues: asyncHandler(async (req, res) => {
//     const { session,schId } = req.query;
//     if (!session) throw new AppError("session is required", 400);
 
//     const data = await feeCollectionService.getMonthlyDues({
//       schId,
//       studentId: req.params.studentId,
//       session,
//     });
 
//     res.status(200).json({ success: true, data });
//   }),

//   // POST /api/fees/collect
//   collectFee: asyncHandler(async (req, res) => {
//     const {
//       session,
//       studentId,
//       mode,
//       refNo,
//       paymentDate,
//       lines,
//       advanceAmount,
//       schId
      
//     } = req.body;

//     if (!session || !studentId || !mode) {
//       throw new AppError("session, studentId and mode are required", 400);
//     }

//     const data = await feeCollectionService.collectFee({
//       schId,
//       userId: req.user._id,
//       session,
//       studentId,
//       mode,
//       refNo,
//       paymentDate,
//       lines,
//       advanceAmount,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Fee collected successfully",
//       data,
//     });
//   }),

//   // POST /api/fees/receipts/:receiptId/cancel   body: { schId, reason }
//   cancelReceipt: asyncHandler(async (req, res) => {
//     const { schId, reason } = req.body;
//     if (!schId) throw new AppError("schId is required", 400);

//     const data = await feeCollectionService.cancelReceipt({
//       schId,
//       userId: req.user._id,
//       receiptId: req.params.receiptId,
//       reason,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Receipt cancelled",
//       data,
//     });
//   }),

//   // GET /api/fees/receipts/:receiptId?schId=
//   getReceipt: asyncHandler(async (req, res) => {
//     const { schId } = req.query;
//     if (!schId) throw new AppError("schId is required", 400);

//     const data = await feeCollectionService.getReceipt({
//       schId,
//       receiptId: req.params.receiptId,
//     });

//     res.status(200).json({ success: true, data });
//   }),

//   // GET /api/fees/receipts?session=&studentId=&from=&to=
//   listReceipts: asyncHandler(async (req, res) => {
//     const { session, studentId, from, to,schId } = req.query;

//     const data = await feeCollectionService.listReceipts({
//       schId,
//       session,
//       studentId,
//       from,
//       to,
//     });

//     res.status(200).json({ success: true, count: data.length, data });
//   }),
// };


const asyncHandler = require("../errorHandlers/asyncHandler");
// const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const feeDemandService = require("../services/feeService");
const feeCollectionService = require("../services/feeCollectionService");

module.exports = {
  // POST /api/fees/demands/monthly
  // installmentMonthNo is validated against SchoolPayModeSetup by the
  // validateInstallmentMonth middleware BEFORE this runs.
  generateMonthlyDemands: asyncHandler(async (req, res) => {
    const { schId, session, resolvedInstallments, missingClasses } =
      req.feeDemandContext;

    const data = await feeDemandService.generateMonthlyDemands({
      schId,
      session,
      userId: req.user._id,
      resolvedInstallments,
    });

    res.status(200).json({
      success: true,
      message: "Monthly fee demands generated",
      data: {
        ...data,
        // classes the admin never configured for this month at all —
        // different from skippedClasses, which is missing the FeePlanSetup
        notConfiguredForThisMonth: missingClasses,
      },
    });
  }),

  // GET /api/fees/students/:studentId/admission-due?session=
  getAdmissionDues: asyncHandler(async (req, res) => {
    const { session } = req.query;
    if (!session) throw new AppError("session is required", 400);

    const data = await feeCollectionService.getAdmissionDues({
      schId: req.user.schId,
      studentId: req.params.studentId,
      session,
    });

    res.status(200).json({ success: true, data });
  }),

  // GET /api/fees/students/:studentId/monthly-due?session=
  getMonthlyDues: asyncHandler(async (req, res) => {
    const { session } = req.query;
    if (!session) throw new AppError("session is required", 400);

    const data = await feeCollectionService.getMonthlyDues({
      schId: req.user.schId,
      studentId: req.params.studentId,
      session,
    });

    res.status(200).json({ success: true, data });
  }),

  // POST /api/fees/collect
  // lines: [{ demandId, amount, concession }]
  collectFee: asyncHandler(async (req, res) => {
    const {
      session,
      studentId,
      mode,
      refNo,
      paymentDate,
      rptnm,
      lines,
      lateFine,
      misc,
      paidAmount,
      schId
    } = req.body;

    if (!session || !studentId || !mode) {
      throw new AppError("session, studentId and mode are required", 400);
    }
    if (paidAmount === undefined || paidAmount === null) {
      throw new AppError("paidAmount is required", 400);
    }

    const data = await feeCollectionService.collectFee({
      schId,
      userId: req.user._id,
      session,
      studentId,
      mode,
      refNo,
      paymentDate,
      rptnm,
      lines,
      lateFine,
      misc,
      paidAmount,
    });

    res.status(201).json({
      success: true,
      message: "Fee collected successfully",
      data,
    });
  }),

  // POST /api/fees/receipts/:receiptId/cancel
  cancelReceipt: asyncHandler(async (req, res) => {
    const data = await feeCollectionService.cancelReceipt({
      schId: req.body.schId,
      userId: req.user._id,
      receiptId: req.params.receiptId,
      reason: req.body.reason,
    });

    res.status(200).json({
      success: true,
      message: "Receipt cancelled",
      data,
    });
  }),

  // GET /api/fees/receipts/:receiptId
  getReceipt: asyncHandler(async (req, res) => {
    const data = await feeCollectionService.getReceipt({
      schId: req.user.schId,
      receiptId: req.params.receiptId,
    });

    res.status(200).json({ success: true, data });
  }),

  // GET /api/fees/receipts?session=&studentId=&from=&to=
  listReceipts: asyncHandler(async (req, res) => {
    const { session, studentId, from, to } = req.query;

    const data = await feeCollectionService.listReceipts({
      schId: req.user.schId,
      session,
      studentId,
      from,
      to,
    });

    res.status(200).json({ success: true, count: data.length, data });
  }),
};
