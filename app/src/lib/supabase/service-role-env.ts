function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See SETUP.md.`);
  }
  return value;
}

/**
 * Server-only. Never prefix with NEXT_PUBLIC_, never import this file
 * (or supabase-service-role-client.ts) from any client component.
 */
export function supabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function cronSecret(): string {
  return requireEnv("CRON_SECRET");
}
