/**
 * Normalise 'YYYY-MM-DD' (or any date input) to a Date at 00:00 UTC.
 * Using UTC midnight avoids server-timezone drift (e.g. IST vs UTC) that breaks
 * "same date" comparisons and unique lookups.
 */
function toDay(input) {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00.000Z`);
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    const err = new Error(`Invalid date: ${input}`);
    err.status = 400;
    throw err;
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

module.exports = { toDay };