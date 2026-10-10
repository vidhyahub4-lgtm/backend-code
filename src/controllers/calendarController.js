const calendarService = require("../services/calendarService");

const ctx = (req) => ({
  schId: req.user?.schId || req.body?.schId || req.query?.schId,
  updatedby: req.user?._id,
});

const statusOf = (result) => (result.failed.length ? 207 : 200); // 207 = some class-sections failed

// POST /api/calendar/mark   (ONE endpoint for single section, whole class, or whole school)
// body: { session, scope: 'SECTION'|'CLASS'|'ALL', clsid?, secids?, dates: [{ date, markas, res? }] }
async function markDates(req, res) {
  try {
    const { session, scope, clsid, secid, secids, dates } = req.body;
    if (!session) return res.status(400).json({ success: false, message: "session is required" });

    const result = await calendarService.markDates({
      ...ctx(req), session, scope, clsid, secid, secids, entries: dates,
    });
    return res.status(statusOf(result)).json({ success: result.failed.length === 0, data: result });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

// GET /api/calendar?session=&clsid=&secid=&from=&to=
async function getCalendar(req, res) {
  try {
    const { session, clsid, secid, from, to } = req.query;
    const data = await calendarService.getCalendar({ ...ctx(req), session, clsid, secid, from, to });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

// DELETE /api/calendar/dates   (same scope rules as /mark)
// body: { session, scope, clsid?, secids?, dates: ['2026-10-10'] }
async function removeDates(req, res) {
  try {
    const { session, scope, clsid, secid, secids, dates } = req.body;
    if (!session) return res.status(400).json({ success: false, message: "session is required" });

    const result = await calendarService.removeDates({
      ...ctx(req), session, scope, clsid, secid, secids, dates,
    });
    return res.status(statusOf(result)).json({ success: result.failed.length === 0, data: result });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

module.exports = { markDates, getCalendar, removeDates };