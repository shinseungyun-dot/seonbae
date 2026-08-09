import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../utils/supabase/admin";
import { createClient } from "../../../utils/supabase/server";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const CREDENTIAL_TYPES = new Set(["enrollment", "degree", "test_score", "certificate", "other"]);

export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("file"));
  if (!Number.isInteger(id)) return jsonError("검증 자료 번호를 확인해 주세요.", 400);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);
  const { data } = await supabase.from("tutor_credentials").select("proof_path").eq("id", id).single();
  if (!data?.proof_path) return jsonError("검증 자료를 찾을 수 없습니다.", 404);
  try {
    const signed = await createAdminClient().storage
      .from("tutor-credentials")
      .createSignedUrl(data.proof_path, 10 * 60);
    if (signed.error || !signed.data?.signedUrl) return jsonError("검증 자료 링크를 만들지 못했습니다.", 500);
    return NextResponse.redirect(signed.data.signedUrl);
  } catch {
    return jsonError("검증 자료 저장소가 설정되지 않았습니다.", 503);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);
  const { data: profile } = await supabase
    .from("profiles")
    .select("role,tutor_registry_id,account_status")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "tutor" || profile.account_status !== "approved") {
    return jsonError("승인된 튜터 계정만 자격 자료를 제출할 수 있습니다.", 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("검증 신청서를 다시 확인해 주세요.", 400);
  }
  const credentialType = formText(form, "credentialType");
  const title = formText(form, "title").slice(0, 180);
  const issuer = formText(form, "issuer").slice(0, 180);
  const score = formText(form, "score").slice(0, 100) || null;
  const issuedOn = formText(form, "issuedOn") || null;
  const proof = form.get("proof");
  if (!CREDENTIAL_TYPES.has(credentialType) || title.length < 2 || issuer.length < 2) {
    return jsonError("자료 유형, 제목과 발급 기관을 확인해 주세요.", 400);
  }
  if (issuedOn && !/^\d{4}-\d{2}-\d{2}$/.test(issuedOn)) {
    return jsonError("발급일 형식을 확인해 주세요.", 400);
  }
  if (!(proof instanceof File) || proof.size === 0) {
    return jsonError("원본 증빙 PDF, JPG 또는 PNG를 첨부해 주세요.", 400);
  }
  if (proof.size > MAX_FILE_BYTES || !ALLOWED_TYPES.has(proof.type)) {
    return jsonError("증빙 자료는 10MB 이하 PDF, JPG 또는 PNG만 가능합니다.", 400);
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("검증 자료 저장소가 설정되지 않았습니다.", 503);
  }
  const proofName = safeFileName(proof.name);
  const proofPath = `${user.id}/${crypto.randomUUID()}-${proofName}`;
  const upload = await admin.storage
    .from("tutor-credentials")
    .upload(proofPath, await proof.arrayBuffer(), { contentType: proof.type, upsert: false });
  if (upload.error) return jsonError("증빙 자료를 안전하게 저장하지 못했습니다.", 500);

  const { data, error } = await admin
    .from("tutor_credentials")
    .insert({
      tutor_id: user.id,
      tutor_registry_id: profile.tutor_registry_id,
      credential_type: credentialType,
      title,
      issuer,
      score,
      issued_on: issuedOn,
      proof_name: proofName,
      proof_path: proofPath,
    })
    .select("id,title,status,created_at")
    .single();
  if (error) {
    await admin.storage.from("tutor-credentials").remove([proofPath]);
    return jsonError("검증 신청을 저장하지 못했습니다.", 500);
  }
  return NextResponse.json(data, { status: 201, headers: { "Cache-Control": "no-store" } });
}

function formText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "credential-proof";
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}
