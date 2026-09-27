const SchoolPayModeSetup = require("../models/super-admin/SchoolPayModeSetup");
const DevSuperSession = require("../models/dev_super/session"); // adjust path
const AppError = require("../utils/appError");
// const catchAsync = require("../utils/catchAsync");
const asyncHandler = require("../errorHandlers/asyncHandler");
/*
 * Runs BEFORE fee demand creation for a specific month.
 * SchoolPayModeSetup is owned by the school ADMIN (which months exist,
 * per class). Fee demand creation is done by a SUB-ADMIN, who only
 * picks a month number from the body — this middleware confirms that
 * month number is one the admin actually configured, for this school
 * and session, before any demand is written.
 *
 * On success it resolves each configured class's real installment
 * ObjectId for that month and attaches it to req, so the controller/
 * service never has to re-query SchoolPayModeSetup or trust a raw
 * ObjectId sent from the frontend.
 */
module.exports = asyncHandler(async (req, res, next) => {
  // const  = req.user.schId; // never trust req.body.schId
  const { session, installmentMonthNo, classID,schId } = req.body;

  if (!session || installmentMonthNo === undefined || installmentMonthNo === null) {
    throw new AppError("session and installmentMonthNo are required", 400);
  }

  const monthNo = Number(installmentMonthNo);
  if (!Number.isInteger(monthNo)) {
    throw new AppError("installmentMonthNo must be a whole number", 400);
  }

  // SchoolPayModeSetup.session is a string ("2026-27"); the rest of the
  // app uses the DevSuperSession ObjectId — resolve it the same way as
  // the fee-plan lookups do.
  const sessionDoc = await DevSuperSession.findById(session).lean();
  if (!sessionDoc) throw new AppError("Session not found", 404);
  const sessionName = sessionDoc.session;

  const payModeSetup = await SchoolPayModeSetup.findOne({
    schId,
    session: sessionName,
  }).lean();

  if (!payModeSetup?.feeStructure?.length) {
    throw new AppError(
      "Pay mode / instalment setup is missing for this session. Ask the admin to set it up first.",
      404,
    );
  }

  // scope to one class if the caller asked for one, else check every class
  const structures = classID
    ? payModeSetup.feeStructure.filter(
        (fs) => fs.class.toString() === String(classID),
      )
    : payModeSetup.feeStructure;

  if (classID && !structures.length) {
    throw new AppError("This class has no instalment setup for this session", 404);
  }

  const resolvedInstallments = []; // classes that DO have this month
  const missingClasses = [];       // classes configured, but not for this month

  structures.forEach((fs) => {
    const inst = (fs.installment || []).find((i) => i.id === monthNo);
    if (inst) {
      resolvedInstallments.push({
        classID: fs.class,
        installmentMonthId: inst._id,   // real ObjectId, resolved server-side
        installmentMonthNo: inst.id,
        installmentLabel: inst.installment, // e.g. "January"
      });
    } else {
      missingClasses.push(fs.class.toString());
    }
  });

  if (!resolvedInstallments.length) {
    throw new AppError(
      `Month ${monthNo} is not configured in the fee setup for this school. ` +
        `Ask the admin to add it in SchoolPayModeSetup first.`,
      404,
    );
  }

  // controller/service read this instead of re-querying SchoolPayModeSetup
  req.feeDemandContext = {
    schId,
    session,
    sessionName,
    installmentMonthNo: monthNo,
    resolvedInstallments,
    missingClasses,
  };

  next();
});