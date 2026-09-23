const mongoose = require("mongoose");
const FeeDemand = require("../models/school-setting/feeDemand");
const FeeReceipt = require("../models/school-setting/Feereceipt");
const FeeCreditLedger = require("../models/school-setting/Feecreditledger");
const Counter = require("../models/school-setting/counter");
const AppError = require("../utils/appError");

const PAY_MODES = ["cash", "upi", "cheque", "online", "card"];

/*
 * Advance balance = total credits - total debits in the ledger.
 */
const getAdvanceBalance = async (schId, studentId, dbSession = null) => {
  const agg = FeeCreditLedger.aggregate([
    {
      $match: {
        schId: new mongoose.Types.ObjectId(schId),
        studentId: new mongoose.Types.ObjectId(studentId),
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  if (dbSession) agg.session(dbSession);

  const rows = await agg;
  const credit = rows.find((r) => r._id === "credit")?.total ?? 0;
  const debit = rows.find((r) => r._id === "debit")?.total ?? 0;
  return credit - debit;
};

module.exports = {
  getAdvanceBalance,

  /*
   * Everything the fee counter screen needs for one student.
   */
  getStudentDues: async ({ schId, studentId, session }) => {
    const demands = await FeeDemand.find({
      schId,
      studentId,
      session,
      status: { $in: ["unpaid", "partial"] },
    })
      .sort({ installmentMonthNo: 1, headType: 1 })
      .lean();

    const items = demands.map((d) => ({
      demandId: d._id,
      headType: d.headType,
      feetype: d.feetype,
      installmentMonthId: d.installmentMonthId,
      installmentMonthNo: d.installmentMonthNo,
      netAmount: d.netAmount,
      paidAmount: d.paidAmount,
      dueAmount: d.netAmount - d.paidAmount, // derived, never stored
      status: d.status,
    }));

    return {
      items,
      totalDue: items.reduce((sum, i) => sum + i.dueAmount, 0),
      advanceBalance: await getAdvanceBalance(schId, studentId),
    };
  },

  /*
   * Collect fees.
   * lines          = [{ demandId, amount }]  what the parent is paying now
   * advanceAmount  = extra money kept as advance credit
   * Cash collected = sum(lines) + advanceAmount
   *
   * Receipt + demand updates + advance entry are ONE transaction.
   */
  collectFee: async ({
    schId,
    userId,
    session,
    studentId,
    mode,
    refNo,
    paymentDate,
    lines,
    advanceAmount = 0,
  }) => {
    if (!PAY_MODES.includes(mode)) {
      throw new AppError("Invalid payment mode", 400);
    }
    if (!Array.isArray(lines) || !lines.length) {
      throw new AppError("At least one fee line is required", 400);
    }

    const ids = lines.map((l) => String(l.demandId));
    if (new Set(ids).size !== ids.length) {
      throw new AppError("Duplicate fee line in request", 400);
    }

    for (const l of lines) {
      const amt = Number(l.amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        throw new AppError("Each line amount must be greater than 0", 400);
      }
    }

    const advance = Number(advanceAmount) || 0;
    if (advance < 0) throw new AppError("Advance cannot be negative", 400);

    const dbSession = await mongoose.startSession();
    let receipt;

    try {
      await dbSession.withTransaction(async () => {
        // load demands INSIDE the transaction so two counters can't overpay
        const demands = await FeeDemand.find({
          _id: { $in: ids },
          schId,
          studentId,
          session,
        }).session(dbSession);

        if (demands.length !== ids.length) {
          throw new AppError("One or more fee items not found for this student", 404);
        }

        const demandMap = new Map(demands.map((d) => [d._id.toString(), d]));
        const receiptLines = [];

        for (const l of lines) {
          const d = demandMap.get(String(l.demandId));
          const amt = Number(l.amount);

          if (d.status === "cancelled") {
            throw new AppError(`${d.feetype} demand is cancelled`, 400);
          }

          const due = d.netAmount - d.paidAmount;
          if (amt > due) {
            throw new AppError(
              `Amount for "${d.feetype}" exceeds the due amount (${due})`,
              400,
            );
          }

          d.paidAmount += amt;
          await d.save({ session: dbSession }); // model hook updates status

          receiptLines.push({
            demandId: d._id,
            headType: d.headType,
            feetype: d.feetype,
            installmentMonthId: d.installmentMonthId,
            amount: amt,
          });
        }

        const receiptNo = await Counter.next(
          `receipt:${schId}:${session}`,
          dbSession,
        );

        [receipt] = await FeeReceipt.create(
          [
            {
              schId,
              session,
              studentId,
              receiptNo,
              paymentDate: paymentDate || new Date(),
              mode,
              refNo,
              lines: receiptLines,
              advanceAmount: advance,
              createdby: userId,
            },
          ],
          { session: dbSession },
        );

        if (advance > 0) {
          await FeeCreditLedger.create(
            [
              {
                schId,
                studentId,
                session,
                type: "credit",
                amount: advance,
                receiptId: receipt._id,
                reason: "advance",
                createdby: userId,
              },
            ],
            { session: dbSession },
          );
        }
      });
    } finally {
      await dbSession.endSession();
    }

    return receipt;
  },

  /*
   * Cancel a receipt: reverse every demand it paid and any advance it created.
   * The receipt stays in the database with status "cancelled".
   */
  cancelReceipt: async ({ schId, userId, receiptId, reason }) => {
    if (!reason?.trim()) {
      throw new AppError("Cancel reason is required", 400);
    }

    const dbSession = await mongoose.startSession();
    let receipt;

    try {
      await dbSession.withTransaction(async () => {
        receipt = await FeeReceipt.findOne({ _id: receiptId, schId }).session(
          dbSession,
        );

        if (!receipt) throw new AppError("Receipt not found", 404);
        if (receipt.status === "cancelled") {
          throw new AppError("Receipt is already cancelled", 400);
        }

        for (const line of receipt.lines) {
          const d = await FeeDemand.findById(line.demandId).session(dbSession);
          if (!d) continue;
          d.paidAmount = Math.max(0, d.paidAmount - line.amount);
          await d.save({ session: dbSession });
        }

        if (receipt.advanceAmount > 0) {
          const balance = await getAdvanceBalance(
            schId,
            receipt.studentId,
            dbSession,
          );
          if (balance < receipt.advanceAmount) {
            throw new AppError(
              "The advance from this receipt has already been used, so it cannot be cancelled",
              400,
            );
          }

          await FeeCreditLedger.create(
            [
              {
                schId,
                studentId: receipt.studentId,
                session: receipt.session,
                type: "debit",
                amount: receipt.advanceAmount,
                receiptId: receipt._id,
                reason: "cancellation",
                createdby: userId,
              },
            ],
            { session: dbSession },
          );
        }

        receipt.status = "cancelled";
        receipt.cancelledAt = new Date();
        receipt.cancelledBy = userId;
        receipt.cancelReason = reason.trim();
        await receipt.save({ session: dbSession });
      });
    } finally {
      await dbSession.endSession();
    }

    return receipt;
  },

  getReceipt: async ({ schId, receiptId }) => {
    const receipt = await FeeReceipt.findOne({ _id: receiptId, schId })
      .populate({ path: "studentId", populate: { path: "regno" } })
      .populate("session")
      .lean();

    if (!receipt) throw new AppError("Receipt not found", 404);
    return receipt;
  },

  /*
   * Filters: session, studentId, from/to (payment date). Use for daily collection.
   */
  listReceipts: async ({ schId, session, studentId, from, to }) => {
    const filter = { schId };
    if (session) filter.session = session;
    if (studentId) filter.studentId = studentId;
    if (from || to) {
      filter.paymentDate = {};
      if (from) filter.paymentDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    return await FeeReceipt.find(filter)
      .populate({ path: "studentId", select: "admno regno" })
      .sort({ paymentDate: -1, receiptNo: -1 })
      .lean();
  },
};