import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/server";
import MyPageClient, { type MyPageProfile } from "./MyPageClient";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name,email,phone,role,created_at,privacy_consent_version,privacy_consented_at,terms_version,terms_agreed_at",
    )
    .eq("id", user.id)
    .single();

  const data: MyPageProfile = {
    name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "사용자",
    email: profile?.email || user.email || "",
    phone: profile?.phone || null,
    role: profile?.role === "admin" ? "admin" : "user",
    createdAt: profile?.created_at || user.created_at,
    privacyVersion: profile?.privacy_consent_version || null,
    privacyConsentedAt: profile?.privacy_consented_at || null,
    termsVersion: profile?.terms_version || null,
    termsAgreedAt: profile?.terms_agreed_at || null,
  };

  return <MyPageClient profile={data} />;
}
