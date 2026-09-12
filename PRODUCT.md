# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS, single file per page, no build step. Hosted on Vercel (project `dream-lord/pouncity`, CLI-deployed, not git-connected). Third-party libraries only via CDN or vendored files. This redesign stays on that stack (confirmed by existing codebase; user did not request a framework).

## Users

Pet owners (dogs and cats) — every owner, not just first-timers. They arrive via shared links (WhatsApp-first audience) curious about a new pet-care product. On this page their job is: understand what Pouncity is, decide it's worth ~5 minutes, and join the waitlist by completing a survey.

## Product Purpose

Pouncity is an upcoming pet-companion platform (peace-of-mind north star): AI-personalized / vet-constrained diet plans, daily care tracking, grooming & vet reminders, and temporary handover to sitters. This page is its public front door: a waitlist landing page where the survey IS the sign-up.

## Positioning

Calm-by-default pet care for every owner. The waitlist is survey-first: instead of a bare email field, joining means answering ~5 minutes of real questions about you and your pet — signal-rich signups, contacted via WhatsApp at launch (not email).

## Operating Context

- Live at pouncity.vercel.app/join-waitlist; source in `join-waitlist/index.html`.
- Sign-up flow: CTA opens JotForm 262526068123050 in a new tab; the page the visitor stays on acknowledges the handoff and remembers returning visitors via localStorage.
- Traffic is heavily mobile (links shared in chat apps); desktop matters for credibility viewing.

## Capabilities and Constraints

- Single-page, no backend; the JotForm is the only data capture. Never publish JotForm /build/ or +iak links — only the public form URL.
- Page must render its content without JavaScript (progressive enhancement); JS layer adds motion.
- Prod deploys are a separate, user-gated step (this session: build + local preview only, per user 2026-09-11).
- OG/social meta and `og.png` exist and must be preserved.

## Brand Commitments

- Name: Pouncity, lowercase wordmark "pouncity" with coral yarn-ball dot; running joke "100% VECTOR FUR".
- Mascot style: flat vector characters (Petbarn/Landor lineage) — ink-black cats and dogs with white googly eyes, coral accents. Cats keep the original circle/triangle-ear construction. Dogs redrawn 2026-09-12 per user-pinned Pinterest reference (the "Barkley" character sheet): single fluid silhouettes, floppy top-mounted ears, sickle tails, nub feet — this construction is now binding for every dog (see DESIGN.md, Dog Construction Rule).
- Palette anchors: sun yellow #FFC93C, ink #161616, cream #FFF7E6, coral #FF6B4A (deep coral #BF3A22 for AA text on light).
- Type anchors: Fredoka (display), DM Sans (body), DM Mono (labels).
- Voice: warm, playful, dog-park puns ("Good things come to those who wag", "almost house-trained"), never guilt-based.
- Motion/art direction reference the user made binding (2026-09-11): dontboardme.com's layer — branded preloader (fast, first visit only, per user), smooth-scroll choreography with scroll-triggered text reveals, color-blocked full-bleed sections with arch dividers, poster-scale ghost display type behind characters, trailing character cursor (fine pointers only), scroll-reactive props. Applied in Pouncity's own palette and mascot language.

## Evidence on Hand

- Working current page: `join-waitlist/index.html` (copy, characters, JotForm link, meta). No testimonials, no user counts, no press — do not fabricate any.
- `og.png` at repo root; favicon is an inline SVG yarn ball.

## Product Principles

1. The survey is the product's first impression: everything on the page exists to earn those 5 minutes.
2. Calm-by-default: playful, never noisy; delight through craft, not clutter; no guilt or pressure mechanics.
3. Mobile is the first-class modality; desktop is the theater version of the same story, never a different story.
4. Motion is progressive enhancement: content renders and converts with JS off, reduced-motion honored everywhere.
5. Truth over theater: no invented numbers, testimonials, or claims.

## Accessibility & Inclusion

prefers-reduced-motion fully honored (all animation off, no content hidden behind it); AA contrast on all text (deep coral #BF3A22 on light surfaces); decorative SVGs aria-hidden; visible focus states; touch targets ≥44px on mobile.
