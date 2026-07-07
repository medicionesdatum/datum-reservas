const weekdaySlots = ["09:00", "11:00", "15:00", "17:00"];
const fridaySlots = ["09:00", "11:00", "15:00"];
const BOOKING_LEAD_TIME_HOURS = 24;
const RESCHEDULE_LEAD_TIME_HOURS = 48;

export function getAllowedSlots(dateValue: string) {
  if (!dateValue) return [];
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();

  if (day === 0 || day === 6) return [];
  if (day === 5) return fridaySlots;
  return weekdaySlots;
}

export function getBookableSlots(dateValue: string) {
  return getAllowedSlots(dateValue).filter((slot) => isAtLeastHoursAhead(dateValue, slot, BOOKING_LEAD_TIME_HOURS));
}

export function isPastDate(dateValue: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(`${dateValue}T00:00:00`);
  return selected < today;
}

export function isValidSlot(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue || isPastDate(dateValue)) return false;
  if (!isAtLeastHoursAhead(dateValue, timeValue, BOOKING_LEAD_TIME_HOURS)) return false;
  return getAllowedSlots(dateValue).includes(timeValue);
}

export function canRescheduleOrCancel(dateValue: string, timeValue: string) {
  return isAtLeastHoursAhead(dateValue, timeValue, RESCHEDULE_LEAD_TIME_HOURS);
}

function isAtLeastHoursAhead(dateValue: string, timeValue: string, hours: number) {
  const selected = new Date(`${dateValue}T${timeValue}:00`);
  return selected.getTime() - Date.now() >= hours * 60 * 60 * 1000;
}

export function nextBusinessDate() {
  const date = new Date();
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6 || getBookableSlots(date.toISOString().slice(0, 10)).length === 0);

  return date.toISOString().slice(0, 10);
}
