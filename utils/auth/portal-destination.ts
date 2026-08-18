import type { SupabaseClient } from "@supabase/supabase-js";
import { TUTOR_CONTRACT_VERSION } from "../contracts/tutor-contract";

export type PortalProfile = {
  role: string | null;
  account_status: string | null;
};

export async function resolvePortalDestination(
  supabase: SupabaseClient,
  userId: string,
  profile: PortalProfile | null,
) {
  if (profile?.role === "admin") return "/admin";
  if (profile?.role === "tutor" && profile.account_status === "pending") {
    const { data: signature, error } = await supabase
      .from("tutor_contract_signatures")
      .select("id")
      .eq("tutor_id", userId)
      .eq("contract_version", TUTOR_CONTRACT_VERSION)
      .maybeSingle();

    return !error && signature ? "/portal/pending" : "/portal/tutor/contract";
  }
  if (profile?.account_status !== "approved") return "/portal/pending";
  return profile.role === "tutor" ? "/portal/tutor" : "/portal";
}
