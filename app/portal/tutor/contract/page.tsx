import { redirect } from "next/navigation";
import { getTutorContractHash } from "../../../../utils/contracts/hash";
import { TUTOR_CONTRACT_VERSION } from "../../../../utils/contracts/tutor-contract";
import { createAdminClient } from "../../../../utils/supabase/admin";
import { createClient } from "../../../../utils/supabase/server";
import TutorContractClient, { type SignedContractReceipt } from "./TutorContractClient";

export const dynamic = "force-dynamic";

export default async function TutorContractPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,phone,role,account_status,tutor_registry_id")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.account_status !== "approved") redirect("/portal/pending");
  if (profile?.role !== "tutor" || !profile.tutor_registry_id) redirect("/portal");

  const admin = createAdminClient();
  const [{ data: application }, { data: signed }] = await Promise.all([
    admin
      .from("account_creation_requests")
      .select("id,status,reviewed_at")
      .eq("user_id", user.id)
      .eq("requested_role", "tutor")
      .maybeSingle(),
    admin
      .from("tutor_contract_signatures")
      .select("id,contract_version,contract_hash,signer_name,signer_birth_date,signer_phone,signer_affiliation,signer_email,signature_path,signature_sha256,signed_at")
      .eq("tutor_id", user.id)
      .eq("contract_version", TUTOR_CONTRACT_VERSION)
      .maybeSingle(),
  ]);

  if (!application || application.status !== "approved" || !application.reviewed_at) {
    redirect("/portal/pending");
  }

  let receipt: SignedContractReceipt | null = null;
  if (signed) {
    const { data: signatureUrl } = await admin.storage
      .from("tutor-contract-signatures")
      .createSignedUrl(signed.signature_path, 30 * 60);
    receipt = {
      id: signed.id,
      version: signed.contract_version,
      contractHash: signed.contract_hash,
      signerName: signed.signer_name,
      birthDate: signed.signer_birth_date,
      phone: signed.signer_phone,
      affiliation: signed.signer_affiliation,
      email: signed.signer_email,
      signatureSha256: signed.signature_sha256,
      signatureUrl: signatureUrl?.signedUrl || null,
      signedAt: signed.signed_at,
    };
  }

  return (
    <TutorContractClient
      contractHash={getTutorContractHash()}
      approvalDate={application.reviewed_at}
      identity={{
        name: profile.full_name || "",
        email: profile.email || user.email || "",
        phone: profile.phone || "",
        registryId: profile.tutor_registry_id,
      }}
      receipt={receipt}
    />
  );
}
