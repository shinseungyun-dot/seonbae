"use client";

import { useRouter } from "next/navigation";

export default function PendingLogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
      }}
    >
      로그아웃
    </button>
  );
}
