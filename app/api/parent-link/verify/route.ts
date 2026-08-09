import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { createAdminClient } from "../../../../utils/supabase/admin";
import { createOtpClient } from "../../../../utils/auth/otp-client";
import {
  readChallenge,
  type FamilyLinkChallenge,
} from "../../../../utils/auth/portal-otp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("로그인이 필요합니다.", 401);

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.replace(/\s/g, "") : "";
  const challengeToken = typeof body.challenge === "string" ? body.challenge : "";
  const challenge = readChallenge<FamilyLinkChallenge>(challengeToken, "family-link");
  if (!challenge || challenge.parentId !== user.id || token.length < 6) {
    return errorResponse("인증번호가 올바르지 않거나 만료되었습니다.", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return errorResponse("학생 연결 서비스를 사용할 수 없습니다.", 503);
  }
  const { data: profiles } = await admin
    .from("profiles")
    .select("id,email,phone,role,account_status")
    .in("id", [challenge.parentId, challenge.studentId]);
  const parent = profiles?.find((profile) => profile.id === challenge.parentId);
  const student = profiles?.find((profile) => profile.id === challenge.studentId);
  if (parent?.role !== "parent" || student?.role !== "student" || parent.account_status !== "approved" || student.account_status !== "approved") {
    return errorResponse("인증번호가 올바르지 않거나 만료되었습니다.", 400);
  }

  const target = challenge.method === "phone" ? student.phone : student.email;
  if (!target) return errorResponse("학생 계정의 인증 수단을 확인할 수 없습니다.", 400);

  const otp = createOtpClient();
  const verified = challenge.method === "phone"
    ? await otp.auth.verifyOtp({ phone: target, token, type: "sms" })
    : await otp.auth.verifyOtp({ email: target, token, type: "email" });
  if (verified.error || verified.data.user?.id !== student.id) {
    return errorResponse("인증번호가 올바르지 않거나 만료되었습니다.", 400);
  }

  const { error } = await admin
    .from("parent_student_links")
    .upsert(
      { parent_id: parent.id, student_id: student.id },
      { onConflict: "parent_id,student_id" },
    );
  if (error) return errorResponse("학생 계정을 연결하지 못했습니다.", 500);

  return NextResponse.json(
    { success: true, message: "학생 계정이 연결되었습니다." },
    { headers: noStoreHeaders() },
  );
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: noStoreHeaders() });
}

function noStoreHeaders() {
  return { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
}
