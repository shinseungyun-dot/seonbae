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
    .select("full_name,email,role")
    .eq("id", user.id)
    .single();

  const role =
    profile?.role === "admin"
      ? "admin"
      : profile?.role === "tutor"
        ? "tutor"
        : profile?.role === "parent"
          ? "parent"
          : "user";
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const displayName =
    profile?.full_name?.trim() ||
    metadataName ||
    (role === "admin"
      ? "ssapgoadmin"
      : profile?.email || user.email || "사용자");

  return NextResponse.json(
    {
      authenticated: true,
      role,
      displayName,
      email: profile?.email || user.email || null,
      destination:
        role === "admin"
          ? "/admin"
          : role === "tutor"
            ? "/portal/tutor"
            : "/portal",
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "Cookie",
      },
    },
  );
}
