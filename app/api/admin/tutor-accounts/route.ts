import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../utils/supabase/admin";
import { createClient } from "../../../../utils/supabase/server";
import { sendTutorAccountCreatedEmail } from "../../../../utils/email/tutor-account";

export const dynamic = "force-dynamic";

const PASSWORD_CHANGE_DAYS = 14;

// Tutor sign-up is closed. An admin provisions the account from a reviewed
// application, and the tutor receives the temporary password by email.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let body: { requestId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const requestId = Number(body.requestId);
  if (!Number.isInteger(requestId)) {
    return NextResponse.json({ error: "지원서를 찾지 못했습니다." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: application } = await admin
    .from("account_creation_requests")
    .select("id,user_id,full_name,email,phone,requested_role,status")
    .eq("id", requestId)
    .single();

  if (!application || application.requested_role !== "tutor") {
    return NextResponse.json({ error: "튜터 지원서를 찾지 못했습니다." }, { status: 404 });
  }
  if (application.user_id) {
    return NextResponse.json({ error: "이미 계정이 있는 지원서입니다." }, { status: 409 });
  }

  const temporaryPassword = generateTemporaryPassword();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: application.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: application.full_name, account_role: "tutor" },
  });

  if (createError || !created.user) {
    const alreadyExists = createError?.message?.toLowerCase().includes("already");
    return NextResponse.json(
      { error: alreadyExists ? "이미 해당 이메일로 가입된 계정이 있습니다." : "계정을 만들지 못했습니다." },
      { status: alreadyExists ? 409 : 500 },
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: application.full_name,
      phone: application.phone,
      role: "tutor",
      account_status: "approved",
      account_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", created.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "계정 정보를 저장하지 못했습니다." }, { status: 500 });
  }

  await admin
    .from("account_creation_requests")
    .update({
      user_id: created.user.id,
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  try {
    await sendTutorAccountCreatedEmail({
      requestId,
      fullName: application.full_name,
      email: application.email,
      temporaryPassword,
      changeByDays: PASSWORD_CHANGE_DAYS,
      loginUrl: `${request.nextUrl.origin}/login`,
    });
  } catch (sendError) {
    // The account exists either way. Surface the failure so the admin can pass
    // the credentials on another channel rather than silently succeeding.
    await admin
      .from("account_creation_requests")
      .update({ notification_error: String(sendError).slice(0, 500) })
      .eq("id", requestId);
    return NextResponse.json(
      { error: "계정은 생성되었지만 안내 메일을 보내지 못했습니다." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

// Meets the sign-up policy (12+ chars, upper, lower, digit, symbol) and is
// generated per request, never stored.
function generateTemporaryPassword() {
  const groups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnpqrstuvwxyz",
    "23456789",
    "!@#$%^&*?",
  ];
  const all = groups.join("");
  const bytes = crypto.getRandomValues(new Uint32Array(16));
  const characters = groups.map((group, index) => group[bytes[index] % group.length]);
  for (let index = groups.length; index < 16; index += 1) {
    characters.push(all[bytes[index] % all.length]);
  }
  // Fisher-Yates with fresh entropy so the leading characters do not reveal the
  // group order.
  const shuffle = crypto.getRandomValues(new Uint32Array(characters.length));
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swap = shuffle[index] % (index + 1);
    [characters[index], characters[swap]] = [characters[swap], characters[index]];
  }
  return characters.join("");
}
