import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";

export const dynamic = "force-dynamic";

const adminLoginId = "ssapgoadmin";
const adminAuthEmail = "ssapgoadmin@seonbae.internal";

export async function POST(request: NextRequest) {
  let body: { identifier?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "로그인 정보를 다시 확인해 주세요." }, { status: 400 });
  }

  const identifier =
    typeof body.identifier === "string" ? body.identifier.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const isAdminLogin = identifier === adminLoginId;
  const email = isAdminLogin ? adminAuthEmail : identifier;

  if (!identifier || !password || (!isAdminLogin && !isEmail(email))) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호를 다시 확인해 주세요." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호를 다시 확인해 주세요." },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (isAdminLogin && profile?.role !== "admin") {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "관리자 권한을 확인하지 못했습니다." },
      { status: 403 },
    );
  }

  return NextResponse.json({
    destination: profile?.role === "admin" ? "/admin" : "/portal",
  });
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
