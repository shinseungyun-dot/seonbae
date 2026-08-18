import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { TUTOR_CONTRACT_VERSION } from "../contracts/tutor-contract";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });
  const remember = request.cookies.get("seonbae-remember")?.value !== "0";

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = { ...options };
          if (!remember && cookieOptions.maxAge !== 0) {
            delete cookieOptions.maxAge;
            delete cookieOptions.expires;
          }
          supabaseResponse.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  // Do not remove this call: it refreshes expired auth tokens when needed.
  await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/portal/tutor")
    && !pathname.startsWith("/portal/tutor/contract")
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,account_status")
        .eq("id", user.id)
        .single();
      if (profile?.role === "tutor" && profile.account_status === "approved") {
        const { data: signature, error } = await supabase
          .from("tutor_contract_signatures")
          .select("id")
          .eq("tutor_id", user.id)
          .eq("contract_version", TUTOR_CONTRACT_VERSION)
          .maybeSingle();
        if (error || !signature) {
          const redirectResponse = NextResponse.redirect(new URL("/portal/tutor/contract", request.url));
          supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
          return redirectResponse;
        }
      }
    }
  }

  return supabaseResponse;
};
