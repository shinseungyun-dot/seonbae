import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { normalizePhone } from "../../../../utils/auth/phone";
import {
  encodeGoogleOnboarding,
  GOOGLE_ONBOARDING_COOKIE,
  type GoogleOnboarding,
} from "../../../../utils/auth/google-onboarding";
import {
  authRateLimitResponse,
  consumeAuthRateLimit,
} from "../../../../utils/auth/rate-limit";

export const dynamic = "force-dynamic";

type GoogleAuthBody = {
  mode?: unknown;
  accountRole?: unknown;
  phone?: unknown;
  privacyAgreed?: unknown;
  termsAgreed?: unknown;
  ageConfirmed?: unknown;
  next?: unknown;
};

export async function POST(request: NextRequest) {
  let body: GoogleAuthBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Google 인증 요청을 다시 확인해 주세요." },
      { status: 400 },
    );
  }

  const mode = body.mode === "signup" ? "signup" : "signin";
  const rateLimit = await consumeAuthRateLimit(
    request,
    mode === "signup" ? "signup" : "authenticate",
  );
  if (!rateLimit.allowed) {
    return authRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  let onboarding: GoogleOnboarding | null = null;

  if (mode === "signup") {
    const phone = normalizePhone(
      typeof body.phone === "string" ? body.phone : "",
    );
    if (!phone) {
      return NextResponse.json(
        { error: "Google 가입에도 올바른 휴대전화번호가 필요합니다." },
        { status: 400 },
      );
    }
    if (
      body.privacyAgreed !== true
      || body.termsAgreed !== true
      || body.ageConfirmed !== true
    ) {
      return NextResponse.json(
        { error: "Google 가입에 필요한 필수 동의를 모두 확인해 주세요." },
        { status: 400 },
      );
    }

    onboarding = {
      role: body.accountRole === "parent" ? "parent" : "student",
      phone,
      privacyAgreed: true,
      termsAgreed: true,
      ageConfirmed: true,
    };
  }

  const callbackUrl = new URL("/api/auth/callback", request.nextUrl.origin);
  callbackUrl.searchParams.set("next", safeDestination(body.next));
  callbackUrl.searchParams.set("provider", "google");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    return NextResponse.json(
      {
        error:
          "Google 인증을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 502 },
    );
  }

  const response = NextResponse.json(
    { url: data.url },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );

  if (onboarding) {
    response.cookies.set(
      GOOGLE_ONBOARDING_COOKIE,
      encodeGoogleOnboarding(onboarding),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 10 * 60,
      },
    );
  } else {
    response.cookies.delete(GOOGLE_ONBOARDING_COOKIE);
  }

  return response;
}

function safeDestination(value: unknown) {
  if (
    typeof value !== "string"
    || !value.startsWith("/")
    || value.startsWith("//")
  ) {
    return "/portal";
  }
  return value;
}
