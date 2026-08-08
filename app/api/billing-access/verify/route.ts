import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "../../../../utils/supabase/server";
import { createOtpClient } from "../../../../utils/auth/otp-client";
import {
  BILLING_ACCESS_COOKIE,
  BILLING_ACCESS_TTL_SECONDS,
  createBillingAccess,
  readChallenge,
  type BillingChallenge,
} from "../../../../utils/auth/portal-otp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("로그인이 필요합니다.", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,email,phone")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") return errorResponse("보호자 계정만 이용할 수 있습니다.", 403);

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.replace(/\s/g, "") : "";
  const challengeToken = typeof body.challenge === "string" ? body.challenge : "";
  const challenge = readChallenge<BillingChallenge>(challengeToken, "billing-challenge");
  if (!challenge || challenge.userId !== user.id || token.length < 6) {
    return errorResponse("인증번호가 올바르지 않거나 만료되었습니다.", 400);
  }

  const target = challenge.method === "phone"
    ? profile.phone || user.phone
    : profile.email || user.email;
  if (!target) return errorResponse("등록된 인증 수단을 확인할 수 없습니다.", 400);

  const otp = createOtpClient();
  const verified = challenge.method === "phone"
    ? await otp.auth.verifyOtp({ phone: target, token, type: "sms" })
    : await otp.auth.verifyOtp({ email: target, token, type: "email" });

  if (verified.error || verified.data.user?.id !== user.id) {
    return errorResponse("인증번호가 올바르지 않거나 만료되었습니다.", 400);
  }

  const response = NextResponse.json(
    { success: true },
    { headers: noStoreHeaders() },
  );
  response.cookies.set(BILLING_ACCESS_COOKIE, createBillingAccess(user.id, request.headers), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: BILLING_ACCESS_TTL_SECONDS,
  });
  return response;
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: noStoreHeaders() });
}

function noStoreHeaders() {
  return { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
}
