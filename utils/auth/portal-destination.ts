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
  if (profile?.account_status !== "approved") return "/portal/pending";
  if (profile.role !== "tutor") return "/portal";

  const { data: signature, error } = await supabase
    .from("tutor_contract_signatures")
    .select("id")
    .eq("tutor_id", userId)
    .eq("contract_version", TUTOR_CONTRACT_VERSION)
    .maybeSingle();

  // Fail closed: a tutor never reaches student data until the current
  // contract signature is positively confirmed.
  return !error && signature ? "/portal/tutor" : "/portal/tutor/contract";
}
