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
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const sessionId = Number(body.sessionId);
  if (!Number.isSafeInteger(sessionId) || sessionId < 1) {
    return NextResponse.json(
      { error: "수업 번호가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const [{ data: profile }, { data: session }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email,role,tutor_registry_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("portal_sessions")
      .select(
        "id,user_id,tutor_registry_id,session_date,starts_at,duration_minutes,title,zoom_meeting_number,zoom_passcode,zoom_host_email,zoom_status",
      )
      .eq("id", sessionId)
      .single(),
  ]);

  if (!profile || !session) {
    return NextResponse.json(
      { error: "이 수업에 접근할 수 없습니다." },
      { status: 403 },
    );
  }

  const isAdmin = profile.role === "admin";
  const isTutor =
    profile.role === "tutor"
    && Boolean(profile.tutor_registry_id)
    && profile.tutor_registry_id === session.tutor_registry_id;
  const isStudent = profile.role === "student" && session.user_id === user.id;
  let isLinkedParent = false;
  if (profile.role === "parent") {
    const { data: familyLink } = await supabase
      .from("parent_student_links")
      .select("parent_id")
      .eq("parent_id", user.id)
      .eq("student_id", session.user_id)
      .maybeSingle();
    isLinkedParent = Boolean(familyLink);
  }
  if (!isAdmin && !isTutor && !isStudent && !isLinkedParent) {
    return NextResponse.json(
      { error: "이 수업에 접근할 수 없습니다." },
      { status: 403 },
    );
  }

  if (!session.zoom_meeting_number || !session.zoom_passcode) {
    return NextResponse.json(
      { error: "Zoom 수업이 아직 준비되지 않았습니다." },
      { status: 409 },
    );
  }
  if (session.zoom_status === "cancelled" || session.zoom_status === "ended") {
    return NextResponse.json(
      { error: "종료되었거나 취소된 수업입니다." },
      { status: 409 },
    );
  }

  const hostRole = isTutor;
  if (!hostRole && !isAdmin && !isStudentJoinWindowOpen(session)) {
    return NextResponse.json(
      { error: "학생 입장은 수업 시작 30분 전부터 가능합니다." },
      { status: 403 },
    );
  }

  try {
    const role: 0 | 1 = hostRole ? 1 : 0;
    const signature = generateMeetingSdkJwt(
      session.zoom_meeting_number,
      role,
    );
    const zak =
      role === 1 && session.zoom_host_email
        ? await getZoomZak(session.zoom_host_email)
        : undefined;

    if (role === 1 && !zak) {
      return NextResponse.json(
        { error: "Zoom 호스트 정보가 없습니다." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        signature,
        meetingNumber: session.zoom_meeting_number,
        password: session.zoom_passcode,
        userName:
          profile.full_name?.trim()
          || profile.email?.split("@")[0]
          || "선배 수강생",
        role,
        zak,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    if (error instanceof ZoomApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status === 503 ? 503 : 502 },
      );
    }
    return NextResponse.json(
      { error: "Zoom 수업 입장 정보를 준비하지 못했습니다." },
      { status: 500 },
    );
  }
}

function isStudentJoinWindowOpen(session: {
  session_date: string;
  starts_at: string;
  duration_minutes: number;
}) {
  const start = new Date(
    `${session.session_date}T${session.starts_at.slice(0, 8)}+09:00`,
  ).getTime();
  const now = Date.now();
  return (
    Number.isFinite(start)
    && now >= start - 30 * 60 * 1000
    && now <= start + (session.duration_minutes + 120) * 60 * 1000
  );
}
