import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "../../../../utils/supabase/server";
import { PRIVACY_POLICY_VERSION, TERMS_VERSION } from "../../../../utils/auth/legal";
import { getPasswordPolicyError } from "../../../../utils/auth/password";
import { normalizePhone } from "../../../../utils/auth/phone";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    fullName?: unknown;
    email?: unknown;
    phone?: unknown;
    password?: unknown;
    privacyAgreed?: unknown;
    termsAgreed?: unknown;
    ageConfirmed?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "가입 정보를 다시 확인해 주세요." }, { status: 400 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phoneInput = typeof body.phone === "string" ? body.phone : "";
  const phone = normalizePhone(phoneInput);
  const password = typeof body.password === "string" ? body.password : "";
  const passwordError = getPasswordPolicyError(password);
  const privacyAgreed = body.privacyAgreed === true;
  const termsAgreed = body.termsAgreed === true;
  const ageConfirmed = body.ageConfirmed === true;

  if (fullName.length < 2 || fullName.length > 80 || !isEmail(email)) {
    return NextResponse.json(
      { error: "이름과 이메일 주소를 다시 확인해 주세요." },
      { status: 400 },
    );
  }
  if (!phone) {
    return NextResponse.json(
      { error: "휴대전화번호를 국가번호와 함께 올바르게 입력해 주세요." },
      { status: 400 },
    );
  }
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }
  if (!privacyAgreed || !termsAgreed || !ageConfirmed) {
    return NextResponse.json(
      { error: "회원가입에 필요한 필수 약관과 개인정보 수집·이용에 동의해 주세요." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        privacy_agreed: true,
        privacy_consent_version: PRIVACY_POLICY_VERSION,
        terms_agreed: true,
        terms_version: TERMS_VERSION,
        age_confirmed: true,
      },
      emailRedirectTo: `${request.nextUrl.origin}/api/auth/callback?next=/portal`,
    },
  });

  if (error) {
    const errorMessage = error.message.toLowerCase();
    const duplicate =
      errorMessage.includes("already") ||
      errorMessage.includes("registered") ||
      errorMessage.includes("exists");
    const rateLimited = errorMessage.includes("rate limit");
    const invalidEmail = errorMessage.includes("invalid") && errorMessage.includes("email");

    return NextResponse.json(
      {
        error: duplicate
          ? "이미 가입된 이메일입니다. 로그인해 주세요."
          : rateLimited
            ? "가입 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
            : invalidEmail
              ? "사용할 수 없는 이메일 주소입니다. 다른 이메일을 입력해 주세요."
              : "회원가입을 완료하지 못했습니다. 입력한 정보를 다시 확인해 주세요.",
      },
      { status: 400 },
    );
  }

  if (!data.user) {
    return NextResponse.json(
      { error: "계정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  if (!data.session) {
    return NextResponse.json({
      message: "인증 메일을 보냈습니다. 메일의 인증 링크를 누른 뒤 포털에 로그인해 주세요.",
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "계정 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("seonbae-remember", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 400 * 24 * 60 * 60,
  });

  return NextResponse.json({ destination: "/portal" });
}

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
