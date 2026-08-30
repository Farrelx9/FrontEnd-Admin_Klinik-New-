// Same local-date approach used elsewhere in the app (Jadwal, Dashboard)
// — never derive a YYYY-MM-DD string via toISOString(), since that
// forces UTC and can roll the date back a day in WIB (UTC+7).
function toDateInput(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return toDateInput(d);
}

export function todayInput() {
  return toDateInput(new Date());
}

export function startOfMonthInput(date = new Date()) {
  return toDateInput(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonthInput(date = new Date()) {
  return toDateInput(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

// Range presets shown as quick-select chips above the report.
export function getPresetRange(key) {
  const today = new Date();
  switch (key) {
    case "today":
      return { start: todayInput(), end: todayInput() };
    case "7days":
      return { start: addDays(todayInput(), -6), end: todayInput() };
    case "thisMonth":
      return { start: startOfMonthInput(today), end: todayInput() };
    case "lastMonth": {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { start: startOfMonthInput(lastMonthDate), end: endOfMonthInput(lastMonthDate) };
    }
    default:
      return { start: startOfMonthInput(today), end: todayInput() };
  }
}

// Inclusive check: does `dateValue` (any parseable date/ISO string) fall
// within [startStr, endStr] (YYYY-MM-DD, inclusive on both ends)?
export function isWithinRange(dateValue, startStr, endStr) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  const start = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T23:59:59.999`);
  return d >= start && d <= end;
}

// List every YYYY-MM-DD between start and end (inclusive) — used to
// build a complete daily revenue series, including zero-value days, so
// the chart doesn't silently skip days with no transactions.
export function eachDayInRange(startStr, endStr) {
  const days = [];
  let cursor = startStr;
  let guard = 0;
  while (cursor <= endStr && guard < 400) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return days;
}
