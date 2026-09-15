import { createBrowserClient } from "@supabase/ssr";

/** The one browser-side Supabase client. Only diary-service.ts and the auth
 *  screens (sign-in, callback) import this — every other screen stays on the
 *  diary-service seam. */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
