import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import {
  generateMeetingSdkJwt,
  getZoomZak,
  ZoomApiError,
} from "../../../../utils/zoom/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { sessionId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const consultationId = Number(body.sessionId);
  if (!Number.isSafeInteger(consultationId) || consultationId < 1) {
    return NextResponse.json({ error: "상담 번호가 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const [{ data: profile }, { data: consultation }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email,role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("consultation_sessions")
      .select(
        "id,parent_id,session_date,starts_at,duration_minutes,zoom_meeting_number,zoom_passcode,zoom_host_email,zoom_status",
      )
      .eq("id", consultationId)
      .single(),
  ]);

  if (!profile || !consultation) {
    return NextResponse.json({ error: "이 상담에 접근할 수 없습니다." }, { status: 403 });
  }

  const isAdmin = profile.role === "admin";
  const isParent = profile.role === "parent" && consultation.parent_id === user.id;
  if (!isAdmin && !isParent) {
    return NextResponse.json({ error: "이 상담에 접근할 수 없습니다." }, { status: 403 });
  }
  if (!consultation.zoom_meeting_number || !consultation.zoom_passcode) {
    return NextResponse.json({ error: "Zoom 상담이 아직 준비되지 않았습니다." }, { status: 409 });
  }
  if (["cancelled", "ended"].includes(consultation.zoom_status)) {
    return NextResponse.json({ error: "종료되었거나 취소된 상담입니다." }, { status: 409 });
  }
  if (isParent && !joinWindowOpen(consultation)) {
    return NextResponse.json(
      { error: "보호자 입장은 상담 시작 30분 전부터 가능합니다." },
      { status: 403 },
    );
  }

  try {
    const role: 0 | 1 = isAdmin ? 1 : 0;
    const signature = generateMeetingSdkJwt(consultation.zoom_meeting_number, role);
    const zak =
      role === 1 && consultation.zoom_host_email
        ? await getZoomZak(consultation.zoom_host_email)
        : undefined;

    if (role === 1 && !zak) {
      return NextResponse.json({ error: "Zoom 호스트 정보가 없습니다." }, { status: 409 });
    }

    return NextResponse.json(
      {
        signature,
        meetingNumber: consultation.zoom_meeting_number,
        password: consultation.zoom_passcode,
        userName:
          profile.full_name?.trim()
          || profile.email?.split("@")[0]
          || "선배 보호자",
        role,
        zak,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof ZoomApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status === 503 ? 503 : 502 },
      );
    }
    return NextResponse.json({ error: "Zoom 상담 입장 정보를 준비하지 못했습니다." }, { status: 500 });
  }
}

function joinWindowOpen(consultation: {
  session_date: string;
  starts_at: string;
  duration_minutes: number;
}) {
  const start = new Date(
    `${consultation.session_date}T${consultation.starts_at.slice(0, 8)}+09:00`,
  ).getTime();
  const now = Date.now();
  return (
    Number.isFinite(start)
    && now >= start - 30 * 60 * 1000
    && now <= start + (consultation.duration_minutes + 120) * 60 * 1000
  );
}
