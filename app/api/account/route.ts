import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  let body: { password?: unknown; confirmation?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "탈퇴 정보를 다시 확인해 주세요." },
      { status: 400 },
    );
  }

  const password = typeof body.password === "string" ? body.password : "";
  const confirmation =
    typeof body.confirmation === "string" ? body.confirmation.trim() : "";

  if (!password || confirmation !== "회원탈퇴") {
    return NextResponse.json(
      { error: "현재 비밀번호와 ‘회원탈퇴’ 확인 문구를 입력해 주세요." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    return NextResponse.json(
      { error: "관리자 계정은 마이페이지에서 삭제할 수 없습니다." },
      { status: 403 },
    );
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (passwordError) {
    return NextResponse.json(
      { error: "현재 비밀번호가 올바르지 않습니다." },
      { status: 403 },
    );
  }

  const { error: deletionError } = await supabase.rpc("delete_my_account");

  if (deletionError) {
    return NextResponse.json(
      { error: "계정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  await supabase.auth.signOut({ scope: "local" });
  const cookieStore = await cookies();
  cookieStore.delete("seonbae-remember");

  return NextResponse.json(
    { deleted: true, destination: "/#/ko/home" },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "Cookie",
      },
    },
  );
}
