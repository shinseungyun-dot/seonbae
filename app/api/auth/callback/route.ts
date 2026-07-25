import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "../../../../utils/supabase/server";

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
