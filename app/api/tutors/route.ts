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

  let { data, error } = await supabase
    .from("tutors")
    .select(
      "registry_id,name,exam,score,category,tier,university,university_en,photo_url,banner_url,display_order",
    )
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("registry_id", { ascending: true });

  if (error) {
    const fallback = await supabase
      .from("tutors")
      .select("registry_id,name,exam,score,category,tier,display_order")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("registry_id", { ascending: true });

    if (fallback.error) {
      return NextResponse.json(
        { error: "Tutor directory is temporarily unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    data = fallback.data?.map((row) => ({
      ...row,
      university: row.registry_id === "P-002" ? "서울대학교" : "고려대학교",
      university_en:
        row.registry_id === "P-002" ? "Seoul National University" : "Korea University",
      photo_url: null,
      banner_url:
        row.registry_id === "P-002"
          ? "/university-snu-banner.png"
          : "/university-korea-banner.png",
    })) as typeof data;
    error = null;
  }

  return NextResponse.json(data ?? [], {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
