# Seonbae authentication email templates

These files mirror the hosted Supabase Auth templates used in production.

| Supabase template | Subject | File |
| --- | --- | --- |
| Confirm signup | `[선배] 이메일 인증을 완료해 주세요` | `confirm-signup.html` |
| Magic link | `[선배] 안전한 계정 접속 링크` | `magic-link.html` |
| Reset password | `[선배] 비밀번호 재설정 안내` | `reset-password.html` |

The templates use Supabase's `{{ .ConfirmationURL }}` and `{{ .Email }}`
variables. Keep the production dashboard copies synchronized with these files.
