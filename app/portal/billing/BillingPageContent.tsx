"use client";

import BillingClient, { type BillingLineItem } from "./BillingClient";
import { usePortalText } from "../PortalLocale";
import styles from "../parent.module.css";

export default function BillingPageContent({ locked, accessExpiresAt, methods, items }: {
  locked: boolean;
  accessExpiresAt: number | null;
  methods: { email: boolean; phone: boolean };
  items: BillingLineItem[];
}) {
  const { text: l } = usePortalText();
  return (
    <div className={styles.shell}>
      <header className={styles.pageHeading}>
        <p>SECURE BILLING</p>
        <h1>{l("수업료 결제", "Lesson billing")}</h1>
        <span>{l("월별 수업 시간, 학생과 튜터, 결제 예정 금액을 확인합니다.", "Review monthly lesson time, students, tutors, and upcoming charges.")}</span>
      </header>
      <BillingClient locked={locked} accessExpiresAt={accessExpiresAt} methods={methods} items={items} />
    </div>
  );
}
