import OtpLinkConfirmation from "../../OtpLinkConfirmation";

export const dynamic = "force-dynamic";

export default async function FamilyConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ challenge?: string }>;
}) {
  const { challenge = "" } = await searchParams;
  return <OtpLinkConfirmation challenge={challenge} mode="family" />;
}
