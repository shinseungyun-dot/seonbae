import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role === "admin" ? "admin" : "user";

  return NextResponse.json(
    {
      authenticated: true,
      role,
      destination: role === "admin" ? "/admin" : "/portal",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
