import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't infer it from a stray lockfile higher up.
  turbopack: { root: path.join(__dirname) },
  // Serve the static marketing pages (symlinked into public/) at clean paths,
  // so one server hosts both the marketing site and the /diary app.
  async rewrites() {
    return [
      { source: "/", destination: "/index.html" },
      { source: "/sign-in", destination: "/sign-in.html" },
      { source: "/join-waitlist", destination: "/join-waitlist.html" },
    ];
  },
};

export default nextConfig;
