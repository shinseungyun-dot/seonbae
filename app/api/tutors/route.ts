import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Tutor directory is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("tutors")
    .select("registry_id,name,exam,score,category,tier,display_order")
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("registry_id", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Tutor directory is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(data ?? [], {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
