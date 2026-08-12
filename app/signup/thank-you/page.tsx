import { redirect } from "next/navigation";
import { createClient } from "../../../utils/supabase/server";
import ThankYouClient from "./ThankYouClient";

export const dynamic = "force-dynamic";

export default async function ThankYouPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=verification-required");

  return <ThankYouClient email={user.email || ""} />;
}
