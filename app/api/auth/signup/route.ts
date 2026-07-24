import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { fullName?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "가입 정보를 다시 확인해 주세요." }, { status: 400 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!fullName || !isEmail(email) || password.length < 8) {
    return NextResponse.json(
      { error: "이름과 이메일을 확인하고 비밀번호를 8자 이상 입력해 주세요." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${request.nextUrl.origin}/portal`,
    },
  });

  if (error) {
    const duplicate = error.message.toLowerCase().includes("already");
    return NextResponse.json(
      { error: duplicate ? "이미 가입된 이메일입니다. 로그인해 주세요." : "회원가입을 완료하지 못했습니다. 입력한 정보를 다시 확인해 주세요." },
      { status: 400 },
    );
  }

  if (data.session) {
    return NextResponse.json({ destination: "/portal" });
  }

  return NextResponse.json({
    message: "가입 확인 메일을 보냈습니다. 이메일 인증을 마치면 로그인할 수 있습니다.",
  });
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
