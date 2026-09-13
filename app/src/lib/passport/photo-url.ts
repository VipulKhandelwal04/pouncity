import { supabaseUrl } from "@/lib/supabase/env";

/**
 * The public URL prefix under which a given owner's own passport-photo
 * uploads live. Used both to build the URL after upload and to verify,
 * server-side, that a submitted photoUrl actually points to that owner's
 * own object rather than an arbitrary string (Server Actions are directly
 * POST-able, so client-side upload flow isn't a trust boundary on its own).
 */
export function ownPassportPhotoPrefix(ownerId: string): string {
  return `${supabaseUrl()}/storage/v1/object/public/passport-photos/${ownerId}/`;
}

export function isOwnPassportPhotoUrl(url: string, ownerId: string): boolean {
  return url.startsWith(ownPassportPhotoPrefix(ownerId));
}
