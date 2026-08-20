import { createHmac, timingSafeEqual } from "node:crypto";

// A tutor application is followed by a separate thank-you page that records
// where the applicant heard about us. That page needs to name the row it is
// updating, and the row id alone would let anyone overwrite another
// applicant's answer, so the id travels with a signature.
//
// Signing is best-effort: if no secret is configured the follow-up question is
// skipped rather than failing the application itself.
export function signApplicationId(id: number) {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(`tutor-application:${id}`).digest("base64url");
}

export function verifyApplicationToken(id: number, token: string) {
  const expected = signApplicationId(id);
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token || "");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function secret() {
  return (
    process.env.AUTH_RATE_LIMIT_SALT
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || (process.env.NODE_ENV !== "production" ? "seonbae-local-application-development" : null)
  );
}
