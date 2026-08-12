import "server-only";

type AccountReviewEmail = {
  requestId: number;
  fullName: string;
  email: string;
  phone: string;
  role: "student" | "parent" | "tutor";
  letterName?: string;
  letterUrl?: string;
};

const roleLabels = {
  student: "학생",
  parent: "보호자",
  tutor: "튜터",
};

export async function sendAdmissionsAccountReviewEmail(input: AccountReviewEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ADMISSIONS_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Admissions email delivery is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `seonbae-account-${input.requestId}`,
    },
    body: JSON.stringify({
      from,
      to: ["admissions@seonbae.com"],
      reply_to: input.email,
      subject: `[선배 가입 심사] ${input.fullName} · ${roleLabels[input.role]}`,
      html: accountReviewHtml(input),
      text: accountReviewText(input),
      tags: [
        { name: "workflow", value: "account_review" },
        { name: "role", value: input.role },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Admissions email failed (${response.status}): ${detail}`);
  }
}

function accountReviewHtml(input: AccountReviewEmail) {
  const documentAction = input.letterUrl && input.letterName
    ? `<p><a href="${escapeHtml(input.letterUrl)}" style="display:inline-block;background:#163a51;color:#fff;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:700">${escapeHtml(input.letterName)} 확인</a></p>`
    : "<p style=\"padding:12px 14px;background:#f4efe5;border-radius:9px;color:#53636c\">이 역할에는 추가 제출 서류가 없습니다.</p>";

  return `
    <div style="font-family:Arial,sans-serif;color:#201e19;line-height:1.6;max-width:620px;background:#fbf7ef;padding:28px">
      <p style="font-size:12px;letter-spacing:.12em;color:#c1663a;font-weight:700">SEONBAE ADMISSIONS</p>
      <h1 style="font-size:24px;color:#163a51">새 계정 심사가 도착했습니다.</h1>
      <table style="border-collapse:collapse;width:100%;margin:20px 0;background:#fffdf7">
        <tr><th style="text-align:left;padding:10px;border-bottom:1px solid #e5ded1">요청 번호</th><td style="padding:10px;border-bottom:1px solid #e5ded1">${input.requestId}</td></tr>
        <tr><th style="text-align:left;padding:10px;border-bottom:1px solid #e5ded1">이름</th><td style="padding:10px;border-bottom:1px solid #e5ded1">${escapeHtml(input.fullName)}</td></tr>
        <tr><th style="text-align:left;padding:10px;border-bottom:1px solid #e5ded1">유형</th><td style="padding:10px;border-bottom:1px solid #e5ded1">${roleLabels[input.role]}</td></tr>
        <tr><th style="text-align:left;padding:10px;border-bottom:1px solid #e5ded1">이메일</th><td style="padding:10px;border-bottom:1px solid #e5ded1">${escapeHtml(input.email)}</td></tr>
        <tr><th style="text-align:left;padding:10px">전화</th><td style="padding:10px">${escapeHtml(input.phone)}</td></tr>
      </table>
      ${documentAction}
      <p style="font-size:12px;color:#6e7788">관리자 포털의 가입 심사 화면에서 승인 또는 반려해 주세요.</p>
    </div>`;
}

function accountReviewText(input: AccountReviewEmail) {
  return [
    "새 계정 심사가 도착했습니다.",
    `요청 번호: ${input.requestId}`,
    `이름: ${input.fullName}`,
    `유형: ${roleLabels[input.role]}`,
    `이메일: ${input.email}`,
    `전화: ${input.phone}`,
    input.letterUrl ? `제출 서류: ${input.letterUrl}` : "추가 제출 서류: 없음",
    "관리자 포털에서 승인 또는 반려해 주세요.",
  ].join("\n");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}
