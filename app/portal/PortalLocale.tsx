"use client";

import { useSeonbaeLocale } from "../../utils/i18n/client";

export function PortalText({ ko, en }: { ko: string; en: string }) {
  return <>{useSeonbaeLocale() === "ko" ? ko : en}</>;
}

export function usePortalText() {
  const locale = useSeonbaeLocale();
  return {
    locale,
    text: (ko: string, en: string) => locale === "ko" ? ko : en,
  };
}

export function PortalDateTime({ value }: { value: string }) {
  const locale = useSeonbaeLocale();
  return <>{new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))}</>;
}
