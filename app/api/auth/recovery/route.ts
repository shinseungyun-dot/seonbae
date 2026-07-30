import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { normalizePhone } from "../../../../utils/auth/phone";
import {
  authRateLimitResponse,
  consumeAuthRateLimit,
} from "../../../../utils/auth/rate-limit";

export const dynamic = "force-dynamic";

type RecoveryAction = "find-id" | "reset-password";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const rateLimit = await consumeAuthRateLimit(request, "recovery");
  if (!rateLimit.allowed) {
    return authRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  let body: {
    action?: unknown;
    fullName?: unknown;
    phone?: unknown;
    email?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return responseAfterDelay(
      startedAt,
      { error: "입력한 정보를 다시 확인해 주세요." },
      400,
    );
  }

  const action =
    body.action === "find-id" || body.action === "reset-password"
      ? (body.action as RecoveryAction)
      : null;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!action || fullName.length < 2 || fullName.length > 80 || !phone) {
    return responseAfterDelay(
      startedAt,
      { error: "이름과 휴대전화번호를 다시 확인해 주세요." },
      400,
    );
  }

  const supabase = await createClient();

  if (action === "find-id") {
    const { error } = await supabase.rpc("request_account_id_email", {
      p_full_name: fullName,
      p_phone: phone,
    });

    if (error) {
      console.error("request_account_id_email RPC failed", {
        code: error.code,
        message: error.message,
      });
      return responseAfterDelay(
        startedAt,
        { error: "계정 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." },
        500,
      );
    }

    return responseAfterDelay(
      startedAt,
      {
        message:
          "입력한 정보가 가입 기록과 일치하면 등록된 이메일로 계정 접속 링크를 보내드립니다. 받은편지함과 스팸함을 확인해 주세요.",
      },
    );
  }

  if (!isEmail(email)) {
    return responseAfterDelay(
      startedAt,
      { error: "가입한 이메일 주소를 올바르게 입력해 주세요." },
      400,
    );
  }

  const { data: verified, error: verificationError } = await supabase.rpc(
    "verify_account_recovery",
    {
      p_full_name: fullName,
      p_phone: phone,
      p_email: email,
    },
  );

  if (!verificationError && verified === true) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/api/auth/callback?next=/reset-password`,
    });
  }

  return responseAfterDelay(startedAt, {
    message:
      "입력한 정보가 가입 기록과 일치하면 비밀번호 재설정 메일을 보내드립니다. 받은편지함과 스팸함을 확인해 주세요.",
  });
}

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function responseAfterDelay(
  startedAt: number,
  body: Record<string, unknown>,
  status = 200,
) {
  const remaining = 450 - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
