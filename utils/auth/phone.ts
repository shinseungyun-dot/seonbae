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

export function formatPhoneInput(value: string) {
  const input = value.trim();
  const digits = input.replace(/\D/g, "").slice(0, 15);

  if (!digits) return input.startsWith("+") ? "+" : "";

  if (input.startsWith("+") || digits.startsWith("82")) {
    const countryDigits = digits.startsWith("82") ? digits.slice(2) : "";
    if (digits.startsWith("82") && countryDigits.startsWith("10")) {
      return joinPhoneGroups("+82", countryDigits.slice(0, 2), countryDigits.slice(2, 6), countryDigits.slice(6, 10));
    }
    return input.startsWith("+") ? `+${digits}` : digits;
  }

  if (digits.startsWith("02")) {
    return joinPhoneGroups(
      digits.slice(0, 2),
      digits.length <= 9 ? digits.slice(2, 5) : digits.slice(2, 6),
      digits.length <= 9 ? digits.slice(5, 9) : digits.slice(6, 10),
    );
  }

  if (digits.startsWith("0")) {
    return joinPhoneGroups(
      digits.slice(0, 3),
      digits.length <= 10 ? digits.slice(3, 6) : digits.slice(3, 7),
      digits.length <= 10 ? digits.slice(6, 10) : digits.slice(7, 11),
    );
  }

  return digits;
}

function joinPhoneGroups(...groups: string[]) {
  return groups.filter(Boolean).join("-");
}
