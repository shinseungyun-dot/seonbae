import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../utils/supabase/admin";
import {
  BILLING_ACCESS_COOKIE,
  BILLING_ACCESS_TTL_SECONDS,
  createBillingAccess,
  readChallenge,
  type BillingChallenge,
} from "../../../../utils/auth/portal-otp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
  const challengeToken = typeof body.challenge === "string" ? body.challenge : "";
  const challenge = readChallenge<BillingChallenge>(challengeToken, "billing-challenge");
  if (!challenge || challenge.method !== "email" || !accessToken) {
    return errorResponse("인증 링크가 올바르지 않거나 만료되었습니다.", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return errorResponse("인증 서비스를 사용할 수 없습니다.", 503);
  }
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || data.user?.id !== challenge.userId) {
    return errorResponse("인증 링크가 올바르지 않거나 만료되었습니다.", 400);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", challenge.userId)
    .single();
  if (profile?.role !== "parent") return errorResponse("보호자 계정만 이용할 수 있습니다.", 403);

  const response = NextResponse.json(
    { success: true },
    { headers: noStoreHeaders() },
  );
  response.cookies.set(
    BILLING_ACCESS_COOKIE,
    createBillingAccess(challenge.userId, request.headers),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: BILLING_ACCESS_TTL_SECONDS,
    },
  );
  return response;
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: noStoreHeaders() });
}

function noStoreHeaders() {
  return { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
}
