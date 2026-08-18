import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

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

  return supabaseResponse;
};
