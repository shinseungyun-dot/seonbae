import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../utils/supabase/admin";
import { createClient } from "../../../../utils/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let body: { id?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 내용을 확인해 주세요." }, { status: 400 });
  }

  const id = typeof body.id === "number" ? body.id : Number(body.id);
  const status = body.status;
  if (!Number.isSafeInteger(id) || id < 1 || !isStatus(status)) {
    return NextResponse.json({ error: "상담 신청 번호와 상태를 확인해 주세요." }, { status: 400 });
  }

  const handled = status === "new"
    ? { handled_by: null, handled_at: null }
    : { handled_by: user.id, handled_at: new Date().toISOString() };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("consultation_requests")
    .update({
      status,
      ...handled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,status")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "상담 상태를 저장하지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json(data);
}

function isStatus(value: unknown): value is "new" | "contacted" | "closed" {
  return value === "new" || value === "contacted" || value === "closed";
}
