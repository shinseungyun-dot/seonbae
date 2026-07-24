import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type ServerClientOptions = {
  remember?: boolean;
};

export const createClient = async ({ remember = true }: ServerClientOptions = {}) => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = { ...options };
            if (!remember && cookieOptions.maxAge !== 0) {
              delete cookieOptions.maxAge;
              delete cookieOptions.expires;
            }
            cookieStore.set(name, value, cookieOptions);
          });
        } catch {
          // Server Components cannot write cookies. Middleware refreshes sessions.
        }
      },
    },
  });
};
