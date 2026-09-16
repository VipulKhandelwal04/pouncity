import type { Viewport } from "next";

/**
 * The sign-in page opens on the sun field, so its browser bar is sun rather
 * than the app's cream (the client page component can't export viewport
 * itself). Everything else inherits the root layout.
 */
export const viewport: Viewport = {
  themeColor: "#FFC93C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
