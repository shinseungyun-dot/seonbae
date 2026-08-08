import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const BILLING_ACCESS_COOKIE = "seonbae-billing-access";
export const OTP_CHALLENGE_TTL_SECONDS = 10 * 60;
export const BILLING_ACCESS_TTL_SECONDS = 12 * 60 * 60;

type HeaderReader = Pick<Headers, "get">;

type BasePayload = {
  kind: string;
  issuedAt: number;
  expiresAt: number;
};

export type BillingChallenge = BasePayload & {
  kind: "billing-challenge";
  userId: string;
  method: "email" | "phone";
};

export type FamilyLinkChallenge = BasePayload & {
  kind: "family-link";
  parentId: string;
  studentId: string;
  method: "email" | "phone";
};

export type BillingAccess = BasePayload & {
  kind: "billing-access";
  userId: string;
  region: string;
  device: string;
};

export function createChallenge<T extends Omit<BasePayload, "issuedAt" | "expiresAt">>(
  payload: T,
  ttlSeconds = OTP_CHALLENGE_TTL_SECONDS,
) {
  const issuedAt = Math.floor(Date.now() / 1000);
  return signPayload({
    ...payload,
    issuedAt,
    expiresAt: issuedAt + ttlSeconds,
  });
}

export function readChallenge<T extends BasePayload>(
  token: string,
  kind: T["kind"],
): T | null {
  const payload = verifyPayload<T>(token);
  if (!payload || payload.kind !== kind) return null;
  if (payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function createBillingAccess(userId: string, headers: HeaderReader) {
  const issuedAt = Math.floor(Date.now() / 1000);
  return signPayload<BillingAccess>({
    kind: "billing-access",
    userId,
    issuedAt,
    expiresAt: issuedAt + BILLING_ACCESS_TTL_SECONDS,
    region: requestRegion(headers),
    device: requestDevice(headers),
  });
}

export function readBillingAccess(
  token: string | undefined,
  userId: string,
  headers: HeaderReader,
) {
  if (!token) return null;
  const payload = readChallenge<BillingAccess>(token, "billing-access");
  if (!payload || payload.userId !== userId) return null;

  const currentRegion = requestRegion(headers);
  const regionChanged =
    payload.region !== "unknown"
    && currentRegion !== "unknown"
    && payload.region !== currentRegion;
  if (regionChanged || payload.device !== requestDevice(headers)) return null;

  return payload;
}

function signPayload<T extends BasePayload>(payload: T) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", securitySecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyPayload<T extends BasePayload>(token: string): T | null {
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;

  const expected = createHmac("sha256", securitySecret())
    .update(encoded)
    .digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function requestRegion(headers: HeaderReader) {
  const country = headers.get("x-vercel-ip-country")?.trim().toUpperCase();
  const region = headers.get("x-vercel-ip-country-region")?.trim().toUpperCase();
  if (!country) return "unknown";
  return region ? `${country}:${region}` : country;
}

function requestDevice(headers: HeaderReader) {
  const userAgent = headers.get("user-agent")?.trim() || "unknown";
  return createHmac("sha256", securitySecret())
    .update(`device:${userAgent}`)
    .digest("base64url")
    .slice(0, 24);
}

function securitySecret() {
  const secret =
    process.env.AUTH_RATE_LIMIT_SALT
    || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "seonbae-local-otp-development";
  throw new Error("Portal OTP signing is not configured.");
}
