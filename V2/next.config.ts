import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't infer it from a stray lockfile higher up.
  turbopack: { root: path.join(__dirname) },
  // Serve the static marketing home at `/`, so one server hosts both the
  // marketing site and the /diary app. (`/sign-in` is a real app route now, so
  // it is not rewritten to a static page.)
  async rewrites() {
    return [{ source: "/", destination: "/index.html" }];
  },
  // The waitlist is retired at launch: anyone can sign up directly. Old links
  // (emails, social) to /join-waitlist land on the marketing home. Temporary
  // (307) rather than permanent (308) so it isn't cached forever if it changes.
  async redirects() {
    return [{ source: "/join-waitlist", destination: "/", permanent: false }];
  },
};

export default nextConfig;
