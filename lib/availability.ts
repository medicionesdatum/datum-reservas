const weekdaySlots = ["09:00", "11:00", "15:00", "17:00"];
const fridaySlots = ["09:00", "11:00", "15:00"];
const BOOKING_LEAD_TIME_HOURS = 24;
const RESCHEDULE_LEAD_TIME_HOURS = 48;
export const BUSINESS_TIME_ZONE = "Europe/Madrid";

export function getAllowedSlots(dateValue: string) {
  if (!isValidDateValue(dateValue)) return [];
  const day = new Date(`${dateValue}T12:00:00Z`).getUTCDay();

  if (day === 0 || day === 6) return [];
  if (day === 5) return fridaySlots;
  return weekdaySlots;
}

export function getBookableSlots(dateValue: string, now = Date.now()) {
  return getAllowedSlots(dateValue).filter((slot) =>
    isAtLeastHoursAhead(dateValue, slot, BOOKING_LEAD_TIME_HOURS, now)
  );
}

export function isPastDate(dateValue: string, now = Date.now()) {
  return !isValidDateValue(dateValue) || dateValue < dateValueInMadrid(now);
}

export function isValidSlot(dateValue: string, timeValue: string, now = Date.now()) {
  if (!dateValue || !timeValue || isPastDate(dateValue, now)) return false;
  if (!isAtLeastHoursAhead(dateValue, timeValue, BOOKING_LEAD_TIME_HOURS, now)) return false;
  return getAllowedSlots(dateValue).includes(timeValue);
}

export function canRescheduleOrCancel(dateValue: string, timeValue: string, now = Date.now()) {
  return isAtLeastHoursAhead(dateValue, timeValue, RESCHEDULE_LEAD_TIME_HOURS, now);
}

function isAtLeastHoursAhead(dateValue: string, timeValue: string, hours: number, now: number) {
  const selected = madridDateTimeToTimestamp(dateValue, timeValue);
  return selected !== null && selected - now >= hours * 60 * 60 * 1000;
}

export function nextBusinessDate(now = Date.now()) {
  let dateValue = dateValueInMadrid(now);
  do {
    dateValue = addDays(dateValue, 1);
  } while (getBookableSlots(dateValue, now).length === 0);

  return dateValue;
}

export function dateValueInMadrid(timestamp = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isValidDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function addDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function madridDateTimeToTimestamp(dateValue: string, timeValue: string) {
  if (!isValidDateValue(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  if (hour > 23 || minute > 59) return null;

  const initial = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    timeZoneName: "longOffset",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(initial));
  const offset = parts.find((part) => part.type === "timeZoneName")?.value;
  const match = offset?.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const direction = match[1] === "+" ? 1 : -1;
  const offsetMinutes = direction * (Number(match[2]) * 60 + Number(match[3]));

  return initial - offsetMinutes * 60 * 1000;
}
