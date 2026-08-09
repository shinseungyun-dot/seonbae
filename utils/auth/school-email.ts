const SCHOOL_EMAIL_PATTERN = /^[^\s@]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.ac\.kr$/i;

export function isKoreanSchoolEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !SCHOOL_EMAIL_PATTERN.test(email)) return false;
  const domain = email.split("@")[1];
  return !domain.includes("..") && !domain.startsWith("-") && !domain.includes(".-");
}

