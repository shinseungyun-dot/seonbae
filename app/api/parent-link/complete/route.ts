import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../utils/supabase/admin";
import {
  readChallenge,
  type FamilyLinkChallenge,
} from "../../../../utils/auth/portal-otp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
  const challengeToken = typeof body.challenge === "string" ? body.challenge : "";
  const challenge = readChallenge<FamilyLinkChallenge>(challengeToken, "family-link");
  if (!challenge || challenge.method !== "email" || !accessToken) {
    return errorResponse("승인 링크가 올바르지 않거나 만료되었습니다.", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return errorResponse("학생 연결 서비스를 사용할 수 없습니다.", 503);
  }
  const { data: verified, error: verifyError } = await admin.auth.getUser(accessToken);
  if (verifyError || verified.user?.id !== challenge.studentId) {
    return errorResponse("승인 링크가 올바르지 않거나 만료되었습니다.", 400);
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id,role,account_status")
    .in("id", [challenge.parentId, challenge.studentId]);
  const parent = profiles?.find((profile) => profile.id === challenge.parentId);
  const student = profiles?.find((profile) => profile.id === challenge.studentId);
  if (parent?.role !== "parent" || student?.role !== "student" || parent.account_status !== "approved" || student.account_status !== "approved") {
    return errorResponse("연결할 계정 정보를 확인할 수 없습니다.", 400);
  }

  const { error } = await admin
    .from("parent_student_links")
    .upsert(
      { parent_id: parent.id, student_id: student.id },
      { onConflict: "parent_id,student_id" },
    );
  if (error) return errorResponse("학생 계정을 연결하지 못했습니다.", 500);

  return NextResponse.json(
    { success: true },
    { headers: noStoreHeaders() },
  );
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: noStoreHeaders() });
}

function noStoreHeaders() {
  return { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
}
