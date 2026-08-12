import { createHmac, timingSafeEqual } from "node:crypto";

export const GOOGLE_LOGIN_ATTEMPT_COOKIE = "seonbae-google-login-attempt";
export const GOOGLE_LOGIN_ATTEMPT_MAX_AGE = 10 * 60;

type GoogleLoginAttempt = {
  issuedAt: number;
  expiresAt: number;
};

export function createGoogleLoginAttempt(now = Date.now()) {
  const payload: GoogleLoginAttempt = {
    issuedAt: now,
    expiresAt: now + GOOGLE_LOGIN_ATTEMPT_MAX_AGE * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readGoogleLoginAttempt(
  token: string | undefined,
  now = Date.now(),
): GoogleLoginAttempt | null {
  if (!token) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;

  const expected = sign(encoded);
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (
    actualBuffer.length !== expectedBuffer.length
    || !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<GoogleLoginAttempt>;
    if (
      !Number.isSafeInteger(payload.issuedAt)
      || !Number.isSafeInteger(payload.expiresAt)
      || payload.issuedAt! > now + 30_000
      || payload.expiresAt! <= now
      || payload.expiresAt! - payload.issuedAt! > GOOGLE_LOGIN_ATTEMPT_MAX_AGE * 1000
    ) {
      return null;
    }
    return payload as GoogleLoginAttempt;
  } catch {
    return null;
  }
}

function sign(value: string) {
  const secret =
    process.env.GOOGLE_LOGIN_GATE_SECRET
    || process.env.AUTH_RATE_LIMIT_SALT
    || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Google login gate is not configured.");
  }
  return createHmac("sha256", secret).update(value).digest("base64url");
}
