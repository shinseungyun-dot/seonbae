export const GOOGLE_ONBOARDING_COOKIE = "seonbae-google-onboarding";

export type GoogleOnboarding = {
  role: "student" | "parent";
  phone: string;
  privacyAgreed: true;
  termsAgreed: true;
  ageConfirmed: true;
};

export function encodeGoogleOnboarding(value: GoogleOnboarding) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function decodeGoogleOnboarding(
  value: string | undefined,
): GoogleOnboarding | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<GoogleOnboarding>;

    if (
      (parsed.role !== "student" && parsed.role !== "parent")
      || typeof parsed.phone !== "string"
      || parsed.privacyAgreed !== true
      || parsed.termsAgreed !== true
      || parsed.ageConfirmed !== true
    ) {
      return null;
    }

    return parsed as GoogleOnboarding;
  } catch {
    return null;
  }
}
