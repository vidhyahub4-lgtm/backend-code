const SchoolPayModeSetup = require("../models/super-admin/SchoolPayModeSetup");
const DevSuperSession = require("../models/dev_super/session"); // adjust path
const Class = require("../models/super-admin/class");
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
  const { session, installmentMonthNo, installmentMonthNos, classID, schId } =
    req.body;

  // accept a list of months; a single `installmentMonthNo` still works
  const rawMonths =
    Array.isArray(installmentMonthNos) && installmentMonthNos.length > 0
      ? installmentMonthNos
      : installmentMonthNo !== undefined && installmentMonthNo !== null
        ? [installmentMonthNo]
        : [];

  if (!session || rawMonths.length === 0) {
    throw new AppError("session and installmentMonthNos are required", 400);
  }

  const monthNos = [...new Set(rawMonths.map(Number))];
  if (monthNos.some((n) => !Number.isInteger(n))) {
    throw new AppError("installmentMonthNos must be whole numbers", 400);
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
    throw new AppError(
      "This class has no instalment setup for this session",
      404,
    );
  }

  const resolvedInstallments = []; // one entry per class per selected month
  const missing = []; // { classId, monthNo } that are NOT configured
  const labelByNo = new Map(); // monthNo -> "January" (for the error message)

  structures.forEach((fs) => {
    monthNos.forEach((monthNo) => {
      const inst = (fs.installment || []).find((i) => i.id === monthNo);
      if (inst) {
        labelByNo.set(inst.id, inst.installment);
        resolvedInstallments.push({
          classID: fs.class,
          installmentMonthId: inst._id, // real ObjectId, resolved server-side
          installmentMonthNo: inst.id,
          installmentLabel: inst.installment, // e.g. "January"
        });
      } else {
        missing.push({ classId: fs.class.toString(), monthNo });
      }
    });
  });

  // All-or-nothing: if any selected month is missing for any class in scope,
  // generate nothing and tell the user exactly what is missing.
  if (missing.length > 0) {
    const classDocs = await Class.find({
      _id: { $in: [...new Set(missing.map((m) => m.classId))] },
    })
      .select("className")
      .lean();
    const nameById = new Map(
      classDocs.map((c) => [String(c._id), c.className]),
    );
    const byClass = new Map();
    missing.forEach(({ classId, monthNo }) => {
      if (!byClass.has(classId)) byClass.set(classId, []);
      byClass.get(classId).push(labelByNo.get(monthNo) || `Month ${monthNo}`);
    });
    const parts = [...byClass].map(
      ([classId, months]) =>
        `Class ${nameById.get(classId) || classId}: ${months.join(", ")}`,
    );

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
    installmentMonthNos: monthNos,
    resolvedInstallments,
    missingClasses: [], // kept so the controller response shape is unchanged
  };

  next();
});
