const mongoose = require("mongoose");
const Calendar = require("../models/school-setting/schcalender");
const { toDay } = require("../utils/Dateutil");
const { MONTH_NAMES, sessionRange, buildSessionMonths } = require("../utils/Monthutil");
const resolver = require("../utils/Classsectionresolver");

const ALLOWED = ["H", "S", "W"];

/**
 * scope decides WHICH class-sections a request touches:
 *   SECTION -> one class + one or more specific sections   (clsid + secids)
 *   CLASS   -> one class + ALL its sections                (clsid)
 *   ALL     -> every class + every section of the school   (nothing else)
 */
const SCOPES = ["SECTION", "CLASS", "ALL"];

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/* ───────────── validation helpers ───────────── */

const assertObjectId = (value, name) => {
  if (!mongoose.isValidObjectId(value)) fail(`${name} must be a valid id`);
};

/** Validate scope + the ids that go with it. Strict on purpose: an ALL request must never carry a clsid. */
function validateScope({ scope, clsid, secids }) {
  if (!SCOPES.includes(scope)) fail(`scope must be one of ${SCOPES.join(", ")}`);

  if (scope === "ALL") {
    if (clsid || secids.length) fail("scope ALL must not include clsid / secids");
    return;
  }

  assertObjectId(clsid, "clsid");

  if (scope === "CLASS") {
    if (secids.length) fail("scope CLASS must not include secids (it covers all sections)");
    return;
  }

  // SECTION
  if (secids.length === 0) fail("scope SECTION needs secid or secids[]");
  secids.forEach((id) => assertObjectId(id, "secid"));
}

/** Validate + normalise incoming entries: [{ date, markas, res }] */
function normaliseEntries(entries, session) {
  if (!Array.isArray(entries) || entries.length === 0) fail("dates array is required");
  const { start, end } = sessionRange(session);

  const seen = new Set();
  return entries.map((e) => {
    if (!ALLOWED.includes(e.markas)) fail(`markas must be one of ${ALLOWED.join(", ")}`);
    if (e.markas === "H" && !(e.res || "").trim()) fail("res (reason) is required when marking a Holiday");

    const date = toDay(e.date);
    if (date < start || date >= end) fail(`${e.date} is outside session ${session}`);

    const key = date.toISOString();
    if (seen.has(key)) fail(`Duplicate date in request: ${e.date}`);
    seen.add(key);

    const out = { date, markas: e.markas };
    if (e.res) out.res = e.res.trim();
    return out;
  });
}

/** accept both secid (single) and secids (array) */
const collectSecids = ({ secid, secids }) => {
  if (Array.isArray(secids)) return secids;
  return secid ? [secid] : [];
};

/** scope -> list of { clsid, secid } */
async function resolveTargets({ schId, scope, clsid, secids }) {
  let targets;
  if (scope === "ALL") targets = await resolver.getAllTargets({ schId });
  else if (scope === "CLASS") targets = await resolver.getClassTargets({ schId, clsid });
  else targets = await resolver.getSectionTargets({ schId, clsid, secids });

  if (targets.length === 0) fail("No class-sections found for this scope", 404);
  return targets;
}

/* ───────────── single class-section operations ───────────── */

const monthOf = (doc, date) => doc.cal.find((m) => m.month === MONTH_NAMES[date.getUTCMonth()]);

/** The single doc for school+session+class+section; creates the 12-month skeleton once */
async function getOrCreateDoc({ schId, session, clsid, secid }) {
  const filter = { schId, session, clsid, secid };
  const doc = await Calendar.findOne(filter);
  if (doc) return doc;

  try {
    return await Calendar.create({ ...filter, cal: buildSessionMonths(session) });
  } catch (err) {
    if (err.code === 11000) return Calendar.findOne(filter); // created by a parallel request
    throw err;
  }
}

/** Put already-validated entries into ONE class-section's calendar doc */
async function applyToOne({ schId, session, clsid, secid, clean, updatedby }) {
  const doc = await getOrCreateDoc({ schId, session, clsid, secid });

  for (const e of clean) {
    const month = monthOf(doc, e.date);
    const existing = month.dates.find((d) => +d.date === +e.date);
    if (existing) {
      existing.markas = e.markas;
      existing.res = e.markas === "H" ? e.res : undefined;
    } else {
      month.dates.push({ ...e });
    }
    month.dates.sort((a, b) => a.date - b.date);
  }

  doc.updatedby = updatedby;
  await doc.save(); // schema validation runs here (res required for H)
  return doc;
}

/** Remove dates from ONE class-section's calendar doc (returns null if it has no doc yet) */
async function removeFromOne({ schId, session, clsid, secid, removeSet }) {
  const doc = await Calendar.findOne({ schId, session, clsid, secid });
  if (!doc) return null;

  doc.cal.forEach((m) => {
    m.dates = m.dates.filter((d) => !removeSet.has(+d.date));
  });
  await doc.save();
  return doc;
}

/* ───────────── public API (one service for single AND many) ───────────── */

/**
 * Mark dates for the class-sections selected by `scope`.
 * One failing class-section does not stop the rest; failures are reported in `failed`.
 */
async function markDates({ schId, session, scope, clsid, secid, secids, entries, updatedby }) {
  const ids = collectSecids({ secid, secids });
  validateScope({ scope, clsid, secids: ids });
  const clean = normaliseEntries(entries, session); // validate once, before touching the DB
  const targets = await resolveTargets({ schId, scope, clsid, secids: ids });

  const failed = [];
  let lastDoc = null;
  let updated = 0;

  for (const t of targets) {
    try {
      lastDoc = await applyToOne({ schId, session, clsid: t.clsid, secid: t.secid, clean, updatedby });
      updated += 1;
    } catch (err) {
      failed.push({ clsid: t.clsid, secid: t.secid, error: err.message });
    }
  }

  return {
    scope,
    session,
    dates: clean.map((c) => ({ date: c.date.toISOString().slice(0, 10), markas: c.markas, res: c.res })),
    matched: targets.length,
    updated,
    failed,
    calendar: targets.length === 1 ? lastDoc : undefined, // full doc only when a single section was targeted
  };
}

/** Remove dates (back to a normal day) for the class-sections selected by `scope` */
async function removeDates({ schId, session, scope, clsid, secid, secids, dates }) {
  const ids = collectSecids({ secid, secids });
  validateScope({ scope, clsid, secids: ids });
  if (!Array.isArray(dates) || dates.length === 0) fail("dates array is required");
  const removeSet = new Set(dates.map((d) => +toDay(d)));
  const targets = await resolveTargets({ schId, scope, clsid, secids: ids });

  const failed = [];
  let updated = 0;

  for (const t of targets) {
    try {
      const doc = await removeFromOne({ schId, session, clsid: t.clsid, secid: t.secid, removeSet });
      if (doc) updated += 1;
    } catch (err) {
      failed.push({ clsid: t.clsid, secid: t.secid, error: err.message });
    }
  }

  return { scope, session, matched: targets.length, updated, failed };
}

/** Get the calendar doc of one class-section, optionally limited to a date range (from/to inclusive) */
async function getCalendar({ schId, session, clsid, secid, from, to }) {
  const doc = await Calendar.findOne({ schId, session, clsid, secid }).lean();
  if (!doc) return { schId, session, clsid, secid, cal: buildSessionMonths(session) };

  if (from || to) {
    const f = from ? toDay(from) : null;
    const t = to ? toDay(to) : null;
    doc.cal.forEach((m) => {
      m.dates = m.dates.filter((d) => (!f || d.date >= f) && (!t || d.date <= t));
    });
  }
  return doc;
}

/** Day type for one date: returns { date, markas, res } or null if nothing special */
async function getDayStatus({ schId, session, clsid, secid, date }) {
  const day = toDay(date);
  const doc = await Calendar.findOne({ schId, session, clsid, secid }).select("cal").lean();
  if (!doc) return null;
  const month = monthOf(doc, day);
  return month?.dates.find((d) => +d.date === +day) || null;
}

/** Use inside markAttendance: blocks attendance on Holiday / weekly-off days */
async function assertWorkingDay({ schId, session, clsid, secid, date }) {
  const entry = await getDayStatus({ schId, session, clsid, secid, date });
  if (entry && (entry.markas === "H" || entry.markas === "S")) {
    fail(
      entry.markas === "H"
        ? `Cannot mark attendance: holiday (${entry.res})`
        : "Cannot mark attendance: weekly off day"
    );
  }
  return true;
}

module.exports = { markDates, removeDates, getCalendar, getDayStatus, assertWorkingDay };