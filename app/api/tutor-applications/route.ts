import { NextRequest, NextResponse } from "next/server";
import { sendAdmissionsAccountReviewEmail } from "../../../utils/email/admissions";
import { normalizePhone } from "../../../utils/auth/phone";
import { isEmailAddress, isKoreanSchoolEmail } from "../../../utils/auth/school-email";
import { authRateLimitResponse, consumeAuthRateLimit } from "../../../utils/auth/rate-limit";
import { createAdminClient } from "../../../utils/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

// Tutor applications arrive before any account exists. Nothing here creates a
// login: an admin reviews the request and provisions the account afterwards.
export async function POST(request: NextRequest) {
  const rateLimit = await consumeAuthRateLimit(request, "signup");
  if (!rateLimit.allowed) return authRateLimitResponse(rateLimit.retryAfterSeconds);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("지원서를 다시 확인해 주세요.", 400);
  }

  const fullName = text(form, "fullName", 80);
  const email = text(form, "email", 254).toLowerCase();
  const phone = normalizePhone(text(form, "phone", 24));
  const university = text(form, "university", 80);
  const subjects = text(form, "subjects", 300);
  const referralCode = text(form, "referralCode", 80);
  const note = [
    text(form, "major", 120) && `전공/학년: ${text(form, "major", 120)}`,
    text(form, "curriculum", 60) && `지원 커리큘럼: ${text(form, "curriculum", 60)}`,
    text(form, "score", 120) && `공식 성적: ${text(form, "score", 120)}`,
    text(form, "introduction", 2000) && `소개: ${text(form, "introduction", 2000)}`,
  ].filter(Boolean).join("\n");

  const acceptanceLetter = form.get("acceptanceLetter");
  const credential = form.get("credential");

  if (fullName.length < 2 || !isEmailAddress(email)) {
    return error("이름과 이메일 주소를 확인해 주세요.", 400);
  }
  if (!isKoreanSchoolEmail(email)) {
    return error("튜터 지원은 .ac.kr로 끝나는 학교 이메일로만 접수됩니다.", 400);
  }
  if (!phone) return error("휴대전화 번호를 국가 번호와 함께 입력해 주세요.", 400);
  if (!university || !subjects) return error("대학교와 수업 가능 과목을 입력해 주세요.", 400);

  const letterError = documentError(acceptanceLetter, "학교 합격통지서", true);
  if (letterError) return error(letterError, 400);
  const credentialError = documentError(credential, "성적·자격 증빙 서류", true);
  if (credentialError) return error(credentialError, 400);

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return error("지원 시스템이 아직 설정되지 않았습니다. 입학팀에 문의해 주세요.", 503);
  }

  const folder = `applications/${crypto.randomUUID()}`;
  const letter = acceptanceLetter as File;
  const proof = credential as File;
  const letterName = safeFileName(letter.name);
  const proofName = safeFileName(proof.name);
  const letterPath = `${folder}/letter-${letterName}`;
  const proofPath = `${folder}/credential-${proofName}`;

  for (const [path, file] of [[letterPath, letter], [proofPath, proof]] as const) {
    const { error: uploadError } = await admin.storage
      .from("account-documents")
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (uploadError) return error("서류를 업로드하지 못했습니다. 다시 시도해 주세요.", 500);
  }

  const { data, error: insertError } = await admin
    .from("account_creation_requests")
    .insert({
      user_id: null,
      full_name: fullName,
      email,
      phone,
      requested_role: "tutor",
      acceptance_letter_path: letterPath,
      acceptance_letter_name: letterName,
      credential_path: proofPath,
      credential_name: proofName,
      university,
      subjects,
      referral_code: referralCode || null,
      applicant_note: note || null,
    })
    .select("id")
    .single();

  if (insertError || !data) {
    return error("지원서를 저장하지 못했습니다. 다시 시도해 주세요.", 500);
  }

  const { data: signed } = await admin.storage
    .from("account-documents")
    .createSignedUrl(letterPath, 60 * 60 * 24 * 7);

  try {
    await sendAdmissionsAccountReviewEmail({
      requestId: data.id,
      fullName,
      email,
      phone,
      role: "tutor",
      letterName,
      letterUrl: signed?.signedUrl,
    });
    await admin
      .from("account_creation_requests")
      .update({ notification_sent_at: new Date().toISOString() })
      .eq("id", data.id);
  } catch (sendError) {
    // The application is already stored; a failed notification is recorded for
    // the admin queue rather than shown to the applicant.
    await admin
      .from("account_creation_requests")
      .update({ notification_error: String(sendError).slice(0, 500) })
      .eq("id", data.id);
  }

  return NextResponse.json({ ok: true });
}

function documentError(value: FormDataEntryValue | null, label: string, required: boolean) {
  if (!(value instanceof File) || value.size === 0) {
    return required ? `${label}를 첨부해 주세요.` : null;
  }
  if (value.size > MAX_DOCUMENT_BYTES || !ALLOWED_DOCUMENT_TYPES.has(value.type)) {
    return `${label}는 10MB 이하 PDF, JPG 또는 PNG만 제출할 수 있습니다.`;
  }
  return null;
}

function text(form: FormData, key: string, max: number) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeFileName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  return cleaned || "document";
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
