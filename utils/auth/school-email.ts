const SCHOOL_EMAIL_PATTERN = /^[^\s@]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.ac\.kr$/i;
const EMAIL_PATTERN = /^[^\s@]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/i;

export function isEmailAddress(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return false;
  const [localPart, domain] = email.split("@");
  return Boolean(
    localPart
    && domain
    && !localPart.startsWith(".")
    && !localPart.endsWith(".")
    && !localPart.includes("..")
    && !domain.includes("..")
    && !domain.startsWith("-")
    && !domain.includes(".-")
    && !domain.includes("-."),
  );
}

export function isKoreanSchoolEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !SCHOOL_EMAIL_PATTERN.test(email)) return false;
  const domain = email.split("@")[1];
  return !domain.includes("..") && !domain.startsWith("-") && !domain.includes(".-");
}
