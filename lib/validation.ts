export function name(value: string, label = "Name") {
  if (!value.trim() || [...value].length > 200)
    throw new Error(`${label} must contain 1–200 characters.`);
  return value;
}
export function numberValue(
  value: string,
  label: string,
  integer = true,
  max = integer ? Number.MAX_SAFE_INTEGER : Number.MAX_VALUE,
) {
  const result = Number(value);
  if (
    !value.trim() ||
    !Number.isFinite(result) ||
    result < 0 ||
    result > max ||
    (integer && !Number.isSafeInteger(result))
  )
    throw new Error(
      `${label} must be a nonnegative ${integer ? "whole number" : "number"}${max < Number.MAX_SAFE_INTEGER ? ` up to ${max}` : ""}.`,
    );
  return result;
}
// Blank means no weekly target; otherwise 1–14 workouts, as the backend enforces.
export function weeklyTarget(value: string) {
  if (!value.trim()) return null;
  const result = Number(value);
  if (!Number.isInteger(result) || result < 1 || result > 14)
    throw new Error(
      "Weekly workout target must be a whole number from 1 to 14, or blank for none.",
    );
  return result;
}
export const passwordHelp =
  "Use at least seven letters/spaces, including an uppercase letter, plus a number and punctuation or a symbol. Maximum 72 UTF-8 bytes.";
export function password(value: string, isNew = false) {
  // Count UTF-8 bytes without requiring TextEncoder on native Hermes.
  let bytes = 0;
  for (const c of value) {
    const n = c.codePointAt(0)!;
    bytes += n <= 0x7f ? 1 : n <= 0x7ff ? 2 : n <= 0xffff ? 3 : 4;
  }
  if (!value || bytes > 72)
    throw new Error("Password is required and must be at most 72 UTF-8 bytes.");
  if (isNew) {
    let letters = 0,
      upper = false,
      numeric = false,
      special = false;
    for (const c of value) {
      if (/\p{N}/u.test(c)) numeric = true;
      else if (/\p{Lu}/u.test(c)) {
        upper = true;
        letters++;
      } else if (/[\p{P}\p{S}]/u.test(c)) special = true;
      else if (/\p{L}/u.test(c) || c === " ") letters++;
      else throw new Error(passwordHelp);
    }
    if (letters < 7 || !upper || !numeric || !special)
      throw new Error(passwordHelp);
  }
  return value;
}
export function dateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Use a real date in YYYY-MM-DD format.");
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1])
    throw new Error("Use a real date in YYYY-MM-DD format.");
  return value;
}
export function timeValue(value: string) {
  if (value && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value))
    throw new Error("Use local time HH:MM or HH:MM:SS, or leave it blank.");
  return value;
}
export function timestamp(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error(
      "Use a date and time with a timezone, e.g. 2026-09-25T08:30:00-05:00.",
    );
  dateValue(value.slice(0, 10));
  timeValue(value.slice(11, 19).split(/[Z+.-]/)[0]);
  return value;
}
export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function weekBounds(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: start.toISOString(), end: end.toISOString() };
}
