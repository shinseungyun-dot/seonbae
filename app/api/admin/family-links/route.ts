import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parentId =
    typeof body.parentId === "string" ? body.parentId.trim() : "";
  const studentId =
    typeof body.studentId === "string" ? body.studentId.trim() : "";
  if (!parentId || !studentId || parentId === studentId) {
    return NextResponse.json(
      { error: "보호자와 학생을 올바르게 선택해 주세요." },
      { status: 400 },
    );
  }

  const { data: profiles } = await auth.supabase
    .from("profiles")
    .select("id,role")
    .in("id", [parentId, studentId]);
  const parent = profiles?.find((profile) => profile.id === parentId);
  const student = profiles?.find((profile) => profile.id === studentId);
  if (parent?.role !== "parent" || student?.role !== "student") {
    return NextResponse.json(
      { error: "보호자 또는 학생 계정 역할이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("parent_student_links")
    .upsert(
      { parent_id: parentId, student_id: studentId },
      { onConflict: "parent_id,student_id" },
    )
    .select("parent_id,student_id")
    .single();
  if (error) {
    return NextResponse.json(
      { error: "가족 계정을 연결하지 못했습니다." },
      { status: 500 },
    );
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const parentId = request.nextUrl.searchParams.get("parentId") || "";
  const studentId = request.nextUrl.searchParams.get("studentId") || "";
  if (!parentId || !studentId) {
    return NextResponse.json(
      { error: "연결 정보를 확인해 주세요." },
      { status: 400 },
    );
  }
  const { error } = await auth.supabase
    .from("parent_student_links")
    .delete()
    .eq("parent_id", parentId)
    .eq("student_id", studentId);
  if (error) {
    return NextResponse.json(
      { error: "가족 연결을 해제하지 못했습니다." },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      ),
    };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 },
      ),
    };
  }
  return { supabase };
}
