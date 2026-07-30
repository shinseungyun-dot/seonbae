import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "../../../../utils/supabase/server";
import { PRIVACY_POLICY_VERSION, TERMS_VERSION } from "../../../../utils/auth/legal";
import {
  decodeGoogleOnboarding,
  GOOGLE_ONBOARDING_COOKIE,
} from "../../../../utils/auth/google-onboarding";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = emailOtpType(request.nextUrl.searchParams.get("type"));
  const next = safeDestination(request.nextUrl.searchParams.get("next"));
  const supabase = await createClient();
  let verified = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    verified = !error;
  }

  if (verified) {
    const cookieStore = await cookies();
    const onboarding = decodeGoogleOnboarding(
      cookieStore.get(GOOGLE_ONBOARDING_COOKIE)?.value,
    );

    if (onboarding) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        cookieStore.delete(GOOGLE_ONBOARDING_COOKIE);
        return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name:
            user.user_metadata?.full_name
            || user.user_metadata?.name
            || null,
          phone: onboarding.phone,
          account_role: onboarding.role,
          privacy_agreed: true,
          privacy_consent_version: PRIVACY_POLICY_VERSION,
          terms_agreed: true,
          terms_version: TERMS_VERSION,
          age_confirmed: true,
        },
      });

      if (metadataError) {
        cookieStore.delete(GOOGLE_ONBOARDING_COOKIE);
        await supabase.auth.signOut({ scope: "local" });
        return NextResponse.redirect(
          new URL("/login?error=google-onboarding", request.nextUrl.origin),
        );
      }
    }

    cookieStore.delete(GOOGLE_ONBOARDING_COOKIE);
    cookieStore.set("seonbae-remember", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 400 * 24 * 60 * 60,
    });

    return NextResponse.redirect(new URL(next, request.nextUrl.origin));
  }

  return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
}

function emailOtpType(value: string | null): EmailOtpType | null {
  const allowedTypes: EmailOtpType[] = [
    "email",
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change",
  ];

  return value && allowedTypes.includes(value as EmailOtpType)
    ? (value as EmailOtpType)
    : null;
}

function safeDestination(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/portal";
  }
  return value;
}
