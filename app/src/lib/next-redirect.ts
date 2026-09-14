/**
 * next/navigation's redirect() throws a special error (digest starting with
 * "NEXT_REDIRECT") to signal navigation to Next's runtime. A client-side
 * try/catch around a Server Action call must detect and rethrow it, or it
 * gets swallowed like any other error and the redirect silently never
 * happens.
 */
export function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
