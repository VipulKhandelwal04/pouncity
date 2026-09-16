import type { MetadataRoute } from "next";

/**
 * The installable-app identity. Android builds its splash screen from this:
 * the 512 icon centered on background_color with `name` beneath it, so the
 * install and launch look like a real app rather than a bookmarked URL.
 * iOS reads the apple-touch-icon + appleWebApp metadata in app/layout.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pouncity",
    short_name: "Pouncity",
    description: "Your pet's diary: feeding, diet, grooming, and a handover any sitter can use.",
    id: "/diary",
    start_url: "/diary",
    scope: "/",
    display: "standalone",
    background_color: "#FFF7E6",
    theme_color: "#FFF7E6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
