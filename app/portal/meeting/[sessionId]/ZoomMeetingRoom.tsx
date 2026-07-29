"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./meeting.module.css";

type JoinResponse = {
  signature: string;
  meetingNumber: string;
  password: string;
  userName: string;
  role: 0 | 1;
  zak?: string;
  error?: string;
};

export default function ZoomMeetingRoom({
  sessionId,
  meetingReady,
  meetingStatus,
}: {
  sessionId: number;
  meetingReady: boolean;
  meetingStatus: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "joined" | "error">("idle");
  const [message, setMessage] = useState("");

  const unavailable =
    !meetingReady
    || meetingStatus === "cancelled"
    || meetingStatus === "ended";

  async function joinMeeting() {
    if (!rootRef.current || unavailable || state === "loading") return;
    setState("loading");
    setMessage("Zoom 보안 연결을 준비하고 있습니다…");

    try {
      const response = await fetch("/api/zoom/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const join = (await response.json()) as JoinResponse;
      if (!response.ok) {
        throw new Error(join.error || "수업 입장 정보를 받지 못했습니다.");
      }

      const { default: ZoomMtgEmbedded } = await import("@zoom/meetingsdk/embedded");
      const client = ZoomMtgEmbedded.createClient();
      await client.init({
        zoomAppRoot: rootRef.current,
        language: "ko-KR",
        patchJsMedia: true,
        leaveOnPageUnload: true,
        customize: {
          meetingInfo: ["topic", "host", "mn", "pwd", "telPwd"],
          video: {
            viewSizes: {
              default: {
                width: Math.min(1080, Math.max(720, rootRef.current.clientWidth)),
                height: 608,
              },
            },
          },
        },
      });
      await client.join({
        signature: join.signature,
        meetingNumber: join.meetingNumber,
        password: join.password,
        userName: join.userName,
        zak: join.zak,
      });
      setState("joined");
      setMessage("");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Zoom 수업에 입장하지 못했습니다.",
      );
    }
  }

  return (
    <section className={styles.roomShell}>
      <div
        className={`${styles.meetingRoot} ${state === "joined" ? styles.activeMeeting : ""}`}
        ref={rootRef}
      />

      {state !== "joined" && (
        <div className={styles.prejoin}>
          <div className={styles.prejoinMark}>先</div>
          <p>SEONBAE SECURE CLASSROOM</p>
          <h2>
            {unavailable
              ? meetingStatus === "ended"
                ? "종료된 수업입니다."
                : meetingStatus === "cancelled"
                  ? "취소된 수업입니다."
                  : "Zoom 수업을 준비하고 있습니다."
              : "웹사이트에서 바로 수업을 시작하세요."}
          </h2>
          <span>
            입장하면 브라우저가 카메라와 마이크 권한을 요청할 수 있습니다.
            수업 화면은 Zoom 보안 인프라를 통해 제공됩니다.
          </span>
          <button
            type="button"
            onClick={joinMeeting}
            disabled={unavailable || state === "loading"}
          >
            {state === "loading" ? "입장 준비 중…" : "Zoom 수업 입장"}
            <i>↗</i>
          </button>
          {message && (
            <p className={state === "error" ? styles.error : styles.status}>
              {message}
            </p>
          )}
          <small>
            입장 시 <Link href="/privacy">개인정보 처리방침</Link>과 Zoom의
            회의 처리 절차가 적용됩니다. 녹화가 시작될 경우 별도 안내가 표시됩니다.
          </small>
        </div>
      )}
    </section>
  );
}
