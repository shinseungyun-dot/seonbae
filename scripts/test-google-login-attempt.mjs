import assert from 'node:assert/strict';

process.env.GOOGLE_LOGIN_GATE_SECRET = 'test-only-google-login-gate-secret';

const {
  createGoogleLoginAttempt,
  readGoogleLoginAttempt,
  GOOGLE_LOGIN_ATTEMPT_MAX_AGE,
} = await import('../utils/auth/google-login-attempt.ts');

const now = 1_800_000_000_000;
const token = createGoogleLoginAttempt(now);
const valid = readGoogleLoginAttempt(token, now + 1_000);

assert.deepEqual(valid, {
  issuedAt: now,
  expiresAt: now + GOOGLE_LOGIN_ATTEMPT_MAX_AGE * 1_000,
});
assert.equal(readGoogleLoginAttempt(`${token}x`, now + 1_000), null);
assert.equal(
  readGoogleLoginAttempt(token, now + GOOGLE_LOGIN_ATTEMPT_MAX_AGE * 1_000),
  null,
);

console.log('google login attempt signing: pass');
