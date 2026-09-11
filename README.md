# Pouncity — Join the Waitlist

Pre-launch waitlist landing page for **Pouncity**, an app for cat & dog owners
(food guidance, daily care, grooming & vet reminders, travel/sitter handover).

A single self-contained page in a flat black-mascot illustration style: animated
cats and dogs drawn as inline SVG, with a **survey-first** sign-up — the survey
*is* the waitlist (no email field).

## Structure

- `join-waitlist/index.html` — the landing page (standalone: inline CSS, JS, and SVG art)
- `og.png` — social share image (1200×630)
- `vercel.json` — redirects `/` → `/join-waitlist`

## Deploy

Hosted on Vercel (project `pouncity`) — live at
<https://pouncity.vercel.app/join-waitlist>.

The CTA opens a JotForm survey (collects name + WhatsApp) in a new tab.

## Design notes

- Palette: sun `#FFC93C`, ink `#161616`, cream `#FFF7E6`, coral accents.
- Type: Fredoka (display), DM Sans (body), DM Mono (labels).
- Responsive via `clamp()` fluid sizing, `ch`/`max-width` limits, and breakpoints
  at 720/900px plus a compact one-viewport mode under 800px tall.
- Respects `prefers-reduced-motion`.
