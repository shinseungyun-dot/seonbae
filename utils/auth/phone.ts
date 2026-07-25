const phoneInputPattern = /^[+\d().\-\s]+$/;
const e164Pattern = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(value: string) {
  const input = value.trim();
  if (!input || !phoneInputPattern.test(input)) return null;

  const digits = input.replace(/\D/g, "");
  let normalized: string;

  if (input.startsWith("+")) {
    normalized = `+${digits}`;
  } else if (digits.startsWith("00")) {
    normalized = `+${digits.slice(2)}`;
  } else if (digits.startsWith("82")) {
    normalized = `+${digits}`;
  } else if (digits.startsWith("0")) {
    normalized = `+82${digits.slice(1)}`;
  } else {
    return null;
  }

  return e164Pattern.test(normalized) ? normalized : null;
}
