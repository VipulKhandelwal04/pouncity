function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See SETUP.md.`);
  }
  return value;
}

export function vapidPublicKey(): string {
  return requireEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
}

export function vapidPrivateKey(): string {
  return requireEnv("VAPID_PRIVATE_KEY");
}

export function vapidSubject(): string {
  return requireEnv("VAPID_SUBJECT");
}
