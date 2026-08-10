import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendAdmissionsAccountReviewEmail } from "../../../../utils/email/admissions";
import { PRIVACY_POLICY_VERSION, TERMS_VERSION } from "../../../../utils/auth/legal";
import { getPasswordPolicyError } from "../../../../utils/auth/password";
import { normalizePhone } from "../../../../utils/auth/phone";
import { isEmailAddress, isKoreanSchoolEmail } from "../../../../utils/auth/school-email";
import {
  authRateLimitResponse,
  consumeAuthRateLimit,
} from "../../../../utils/auth/rate-limit";
import { createAdminClient } from "../../../../utils/supabase/admin";
import { createClient } from "../../../../utils/supabase/server";

export const dynamic = "force-dynamic";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);
type AccountRole = "student" | "parent" | "tutor";

export async function POST(request: NextRequest) {
  const rateLimit = await consumeAuthRateLimit(request, "signup");
  if (!rateLimit.allowed) return authRateLimitResponse(rateLimit.retryAfterSeconds);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "가입 정보를 다시 확인해 주세요." },
      { status: 400 },
    );
  }

  const fullName = formText(form, "fullName").slice(0, 80);
  const email = formText(form, "email").toLowerCase();
  const phone = normalizePhone(formText(form, "phone"));
  const password = formText(form, "password");
  const accountRole = parseRole(formText(form, "accountRole"));
  const isTutor = accountRole === "tutor";
  const privacyAgreed = formText(form, "privacyAgreed") === "true";
  const termsAgreed = formText(form, "termsAgreed") === "true";
  const ageConfirmed = formText(form, "ageConfirmed") === "true";
  const acceptanceLetter = form.get("acceptanceLetter");
  const passwordError = getPasswordPolicyError(password);

  if (fullName.length < 2 || !isEmailAddress(email)) {
    return NextResponse.json(
      { error: "이름과 이메일 주소를 확인해 주세요." },
      { status: 400 },
    );
  }
  if (isTutor && !isKoreanSchoolEmail(email)) {
    return NextResponse.json(
      { error: "튜터는 .ac.kr로 끝나는 학교 이메일을 사용해야 합니다." },
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
  if (isTutor && (!(acceptanceLetter instanceof File) || acceptanceLetter.size === 0)) {
    return NextResponse.json(
      { error: "학교 합격통지서를 첨부해 주세요." },
      { status: 400 },
    );
  }
  if (
    isTutor
    && acceptanceLetter instanceof File
    && (acceptanceLetter.size > MAX_DOCUMENT_BYTES
    || !ALLOWED_DOCUMENT_TYPES.has(acceptanceLetter.type))
  ) {
    return NextResponse.json(
      { error: "합격통지서는 10MB 이하 PDF, JPG 또는 PNG만 제출할 수 있습니다." },
      { status: 400 },
    );
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "회원가입 시스템이 아직 설정되지 않았습니다. 선배 팀에 문의해 주세요." },
      { status: 503 },
    );
  }

  const { data: existingPhone, error: phoneLookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();

  if (phoneLookupError) {
    return NextResponse.json(
      { error: "휴대전화번호 중복 여부를 확인하지 못했습니다. 다시 시도해 주세요." },
      { status: 503 },
    );
  }
  if (existingPhone) {
    return NextResponse.json(
      { error: "이미 다른 계정에서 사용 중인 휴대전화번호입니다." },
      { status: 409 },
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
        account_role: accountRole,
        privacy_agreed: true,
        privacy_consent_version: PRIVACY_POLICY_VERSION,
        terms_agreed: true,
        terms_version: TERMS_VERSION,
        age_confirmed: true,
      },
      emailRedirectTo: `${request.nextUrl.origin}/api/auth/callback?next=${isTutor ? "/portal/pending" : "/portal"}`,
    },
  });

  if (error || !data.user) return signupError(error?.message);
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    await supabase.auth.signOut();
    return signupError("already registered");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      phone,
      account_status: isTutor ? "pending" : "approved",
      account_reviewed_at: isTutor ? null : new Date().toISOString(),
    })
    .eq("id", data.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json(
      {
        error: profileError.code === "23505"
          ? "이미 다른 계정에서 사용 중인 휴대전화번호입니다."
          : "계정 정보를 저장하지 못했습니다. 다시 시도해 주세요.",
      },
      { status: profileError.code === "23505" ? 409 : 500 },
    );
  }

  if (!isTutor) {
    await setRememberCookie(Boolean(data.session));
    return NextResponse.json({
      destination: data.session ? "/portal" : undefined,
      message: data.session
        ? "회원가입이 완료되었습니다."
        : "이메일 인증 링크를 보냈습니다.",
      reviewPending: false,
    });
  }

  if (!(acceptanceLetter instanceof File)) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json(
      { error: "학교 합격통지서를 첨부해 주세요." },
      { status: 400 },
    );
  }

  const safeName = safeFileName(acceptanceLetter.name);
  const documentPath = `${data.user.id}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await admin.storage
    .from("account-documents")
    .upload(documentPath, await acceptanceLetter.arrayBuffer(), {
      contentType: acceptanceLetter.type,
      upsert: false,
    });

  if (uploadError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json(
      { error: "합격통지서를 안전하게 저장하지 못했습니다. 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  const { data: application, error: applicationError } = await admin
    .from("account_creation_requests")
    .insert({
      user_id: data.user.id,
      full_name: fullName,
      email,
      phone,
      requested_role: accountRole,
      acceptance_letter_path: documentPath,
      acceptance_letter_name: safeName,
    })
    .select("id")
    .single();

  if (applicationError || !application) {
    await admin.storage.from("account-documents").remove([documentPath]);
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json(
      { error: "가입 심사 요청을 저장하지 못했습니다. 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  let notificationError: string | null = null;
  try {
    const { data: signed, error: signedError } = await admin.storage
      .from("account-documents")
      .createSignedUrl(documentPath, 7 * 24 * 60 * 60);
    if (signedError || !signed?.signedUrl) throw signedError || new Error("No document URL");

    await sendAdmissionsAccountReviewEmail({
      requestId: application.id,
      fullName,
      email,
      phone,
      role: accountRole,
      letterName: safeName,
      letterUrl: signed.signedUrl,
    });
  } catch (mailError) {
    notificationError = mailError instanceof Error ? mailError.message.slice(0, 500) : "Email failed";
  }

  await admin
    .from("account_creation_requests")
    .update(
      notificationError
        ? { notification_error: notificationError, updated_at: new Date().toISOString() }
        : { notification_sent_at: new Date().toISOString(), notification_error: null, updated_at: new Date().toISOString() },
    )
    .eq("id", application.id);

  await setRememberCookie(Boolean(data.session));

  return NextResponse.json({
    destination: data.session ? "/portal/pending" : undefined,
    message: data.session
      ? "가입 심사 요청을 접수했습니다. 승인 전까지 심사 현황을 확인할 수 있습니다."
      : "학교 이메일 인증 링크를 보냈습니다. 인증 후 선배 팀의 가입 심사가 시작됩니다.",
    reviewPending: true,
    notificationQueued: Boolean(notificationError),
  });
}

function formText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseRole(value: string): AccountRole {
  return value === "parent" || value === "tutor" ? value : "student";
}

function safeFileName(value: string) {
  const clean = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return clean.slice(0, 120) || "acceptance-letter";
}

async function setRememberCookie(hasSession: boolean) {
  if (!hasSession) return;
  const cookieStore = await cookies();
  cookieStore.set("seonbae-remember", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 400 * 24 * 60 * 60,
  });
}

function signupError(message = "") {
  const normalized = message.toLowerCase();
  const duplicate = normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists");
  const rateLimited = normalized.includes("rate limit");
  return NextResponse.json(
    {
      error: duplicate
        ? "이미 가입 또는 심사 중인 이메일입니다. 로그인해 주세요."
        : rateLimited
          ? "가입 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
          : "가입 신청을 완료하지 못했습니다. 입력한 정보를 다시 확인해 주세요.",
    },
    { status: 400 },
  );
}
