export function normalizePhoneNumber(value: string | undefined) {
  const raw = value?.trim();
  if (!raw || !/^[+()\d\s.-]+$/.test(raw)) return null;

  const digits = raw.replace(/\D/g, "");
  let internationalDigits: string;

  if (raw.startsWith("+")) {
    internationalDigits = digits;
  } else if (digits.startsWith("00")) {
    internationalDigits = digits.slice(2);
  } else if (digits.length === 9) {
    internationalDigits = `34${digits}`;
  } else if (digits.length >= 10 && digits.length <= 16 && !digits.startsWith("0")) {
    internationalDigits = digits;
  } else {
    return null;
  }

  if (
    internationalDigits.length < 9 ||
    internationalDigits.length > 16 ||
    internationalDigits.startsWith("0")
  ) {
    return null;
  }

  if (
    internationalDigits.startsWith("34") &&
    internationalDigits.length === 11 &&
    !/^[6789]/.test(internationalDigits.slice(2))
  ) {
    return null;
  }

  return `+${internationalDigits}`;
}
