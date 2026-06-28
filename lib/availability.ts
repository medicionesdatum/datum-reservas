const weekdaySlots = ["09:00", "11:00", "15:00", "17:00"];
const fridaySlots = ["09:00", "11:00", "15:00"];

export function getAllowedSlots(dateValue: string) {
  if (!dateValue) return [];
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();

  if (day === 0 || day === 6) return [];
  if (day === 5) return fridaySlots;
  return weekdaySlots;
}

export function isPastDate(dateValue: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(`${dateValue}T00:00:00`);
  return selected < today;
}

export function isValidSlot(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue || isPastDate(dateValue)) return false;
  return getAllowedSlots(dateValue).includes(timeValue);
}

export function nextBusinessDate() {
  const date = new Date();
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6);

  return date.toISOString().slice(0, 10);
}
