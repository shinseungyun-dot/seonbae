export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_ALLOWED_SYMBOLS = "!@#$%^&*()_+-=[]{};':\"\\|<>?,./`~";

const lowerCasePattern = /[a-z]/;
const upperCasePattern = /[A-Z]/;
const numberPattern = /[0-9]/;
const symbolPattern = /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/;
const allowedCharactersPattern = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]+$/;

export type PasswordChecks = {
  length: boolean;
  lower: boolean;
  upper: boolean;
  number: boolean;
  symbol: boolean;
  allowed: boolean;
};

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    length:
      password.length >= PASSWORD_MIN_LENGTH &&
      password.length <= PASSWORD_MAX_LENGTH,
    lower: lowerCasePattern.test(password),
    upper: upperCasePattern.test(password),
    number: numberPattern.test(password),
    symbol: symbolPattern.test(password),
    allowed: allowedCharactersPattern.test(password),
  };
}

export function getPasswordPolicyError(password: string) {
  const checks = getPasswordChecks(password);

  if (!checks.length) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }
  if (!checks.lower || !checks.upper || !checks.number || !checks.symbol) {
    return "비밀번호에는 영문 소문자·대문자·숫자·특수문자가 각각 하나 이상 필요합니다.";
  }
  if (!checks.allowed) {
    return "비밀번호에는 공백, 한글 또는 허용되지 않은 문자를 사용할 수 없습니다.";
  }

  return null;
}
