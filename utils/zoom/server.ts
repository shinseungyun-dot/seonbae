import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const DEFAULT_ZOOM_API_URL = "https://api.zoom.us";

type ZoomAccessToken = {
  token: string;
  apiUrl: string;
  expiresAt: number;
};

type CreateZoomMeetingInput = {
  hostEmail: string;
  topic: string;
  startTime: string;
  durationMinutes: number;
};

export type ZoomMeeting = {
  id: number;
  uuid: string;
  password?: string;
  start_url?: string;
  join_url?: string;
};

let cachedAccessToken: ZoomAccessToken | null = null;

export class ZoomApiError extends Error {
  status: number;
  code: number | string | null;

  constructor(message: string, status: number, code: number | string | null = null) {
    super(message);
    this.name = "ZoomApiError";
    this.status = status;
    this.code = code;
  }
}

export function zoomConfigurationStatus() {
  const missing = [
    "ZOOM_S2S_ACCOUNT_ID",
    "ZOOM_S2S_CLIENT_ID",
    "ZOOM_S2S_CLIENT_SECRET",
    "ZOOM_MEETING_SDK_CLIENT_ID",
    "ZOOM_MEETING_SDK_CLIENT_SECRET",
    "ZOOM_WEBHOOK_SECRET_TOKEN",
  ].filter((key) => !process.env[key]?.trim());

  return {
    configured: missing.length === 0,
    missing,
  };
}

export function getDefaultZoomHostEmail() {
  return process.env.ZOOM_DEFAULT_HOST_EMAIL?.trim().toLowerCase() || null;
}

export async function createZoomMeeting({
  hostEmail,
  topic,
  startTime,
  durationMinutes,
}: CreateZoomMeetingInput) {
  const meetingPasscode = randomPasscode();
  const response = await zoomApiFetch(
    `/v2/users/${encodeURIComponent(hostEmail)}/meetings`,
    {
      method: "POST",
      body: JSON.stringify({
        topic,
        type: 2,
        start_time: startTime,
        duration: durationMinutes,
        timezone: "Asia/Seoul",
        password: meetingPasscode,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          approval_type: 2,
          allow_multiple_devices: false,
          auto_recording: "none",
        },
      }),
    },
  );

  return (await response.json()) as ZoomMeeting;
}

export async function deleteZoomMeeting(meetingNumber: string) {
  await zoomApiFetch(`/v2/meetings/${encodeURIComponent(meetingNumber)}`, {
    method: "DELETE",
  });
}

export async function getZoomZak(hostEmail: string) {
  const response = await zoomApiFetch(
    `/v2/users/${encodeURIComponent(hostEmail)}/token?type=zak`,
  );
  const payload = (await response.json()) as { token?: string };
  if (!payload.token) {
    throw new ZoomApiError("Zoom 호스트 인증 토큰을 받지 못했습니다.", 502);
  }
  return payload.token;
}

export function generateMeetingSdkJwt(
  meetingNumber: string,
  role: 0 | 1,
) {
  const clientId = requiredEnvironmentValue("ZOOM_MEETING_SDK_CLIENT_ID");
  const clientSecret = requiredEnvironmentValue("ZOOM_MEETING_SDK_CLIENT_SECRET");
  const issuedAt = Math.floor(Date.now() / 1000) - 30;
  const expiresAt = issuedAt + 60 * 60;
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    appKey: clientId,
    mn: meetingNumber,
    role,
    iat: issuedAt,
    exp: expiresAt,
    tokenExp: expiresAt,
    video_webrtc_mode: 1,
  };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", clientSecret)
    .update(unsignedToken)
    .digest("base64url");

  return `${unsignedToken}.${signature}`;
}

export function verifyZoomWebhookSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
) {
  const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim();
  if (!webhookSecret || !timestamp || !signature) return false;

  const timestampSeconds = Number(timestamp);
  if (
    !Number.isFinite(timestampSeconds)
    || Math.abs(Date.now() - timestampSeconds * 1000) > 5 * 60 * 1000
  ) {
    return false;
  }

  const expected = `v0=${createHmac("sha256", webhookSecret)
    .update(`v0:${timestamp}:${rawBody}`)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return (
    expectedBuffer.length === signatureBuffer.length
    && timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

export function zoomWebhookValidationResponse(plainToken: string) {
  const webhookSecret = requiredEnvironmentValue("ZOOM_WEBHOOK_SECRET_TOKEN");
  return {
    plainToken,
    encryptedToken: createHmac("sha256", webhookSecret)
      .update(plainToken)
      .digest("hex"),
  };
}

async function zoomApiFetch(path: string, init: RequestInit = {}) {
  const access = await getZoomAccessToken();
  const response = await fetch(`${access.apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${access.token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (response.ok) return response;

  let message = "Zoom 요청을 처리하지 못했습니다.";
  let code: number | string | null = null;
  try {
    const payload = (await response.json()) as {
      code?: number | string;
      message?: string;
      reason?: string;
    };
    code = payload.code ?? null;
    message = payload.message || payload.reason || message;
  } catch {
    // Preserve the safe fallback message.
  }

  throw new ZoomApiError(message, response.status, code);
}

async function getZoomAccessToken() {
  if (
    cachedAccessToken
    && cachedAccessToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedAccessToken;
  }

  const accountId = requiredEnvironmentValue("ZOOM_S2S_ACCOUNT_ID");
  const clientId = requiredEnvironmentValue("ZOOM_S2S_CLIENT_ID");
  const clientSecret = requiredEnvironmentValue("ZOOM_S2S_CLIENT_SECRET");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ZoomApiError(
      "Zoom 서버 인증에 실패했습니다. 앱 자격 증명과 활성화 상태를 확인해 주세요.",
      response.status,
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    api_url?: string;
  };
  if (!payload.access_token) {
    throw new ZoomApiError("Zoom 서버 인증 토큰이 없습니다.", 502);
  }

  cachedAccessToken = {
    token: payload.access_token,
    apiUrl: normalizeApiUrl(payload.api_url),
    expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000,
  };
  return cachedAccessToken;
}

function normalizeApiUrl(value?: string) {
  if (!value) return DEFAULT_ZOOM_API_URL;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.origin : DEFAULT_ZOOM_API_URL;
  } catch {
    return DEFAULT_ZOOM_API_URL;
  }
}

function requiredEnvironmentValue(key: string) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new ZoomApiError(
      "Zoom 연동 정보가 아직 설정되지 않았습니다.",
      503,
      key,
    );
  }
  return value;
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function randomPasscode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
