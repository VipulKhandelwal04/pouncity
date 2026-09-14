"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Persistent bottom nav across the three top-level owner screens: Diary,
 * Find care, My circle. Deliberately absent from DetailShell's focused
 * drill-ins (diet/grooming/share/a provider's profile) — those keep their
 * single "back" link so editing stays distraction-free. Fixed positioning:
 * pair with the `.app-shell--tabbed` bottom padding on any page that renders
 * this, so content never sits behind it.
 */
export function TabBar() {
  const pathname = usePathname();

  const items = [
    { href: "/diary", label: "Diary", icon: DiaryIcon },
    { href: "/find-care", label: "Find care", icon: FindCareIcon },
    { href: "/circle", label: "My circle", icon: CircleIcon },
    { href: "/requests", label: "Requests", icon: RequestsIcon },
  ];

  return (
    <nav className="tabbar" aria-label="Primary">
      <div className="tabbar-inner">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="tabbar-item"
              aria-current={active ? "page" : undefined}
            >
              <Icon />
              <span className="tabbar-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DiaryIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5C5 3.7 5.7 3 6.5 3H16a2 2 0 0 1 2 2v14.5a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 19.5V4.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 8h6M9 12h6M9 16h3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FindCareIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M19 19l-3.7-3.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RequestsIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 5.5l9 5.5 9-5.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="22" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17" cy="9.5" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3 20c.8-4 3.1-6 5.5-6s4.7 2 5.5 6M15 20c.5-3 2.1-4.6 4-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
