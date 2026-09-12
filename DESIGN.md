---
name: Pouncity
description: Flat-vector mascot picture book — color-blocked scroll story for the Pouncity waitlist
colors:
  sun: "#FFC93C"
  sun-ghost: "#8F6500"
  cream: "#FFF7E6"
  panel: "#FFFDF6"
  cream-ghost: "#F1E3C2"
  coral: "#FF6B4A"
  coral-deep: "#D8492B"
  coral-ghost: "#7E1F0A"
  coral-text: "#BF3A22"
  ink: "#161616"
  ink-ghost: "#2B2B2B"
  eye-white: "#FFFFFF"
typography:
  display:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "clamp(2.75rem, 11.5vw, 9.5rem)"
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "clamp(2.2rem, 6.5vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, -apple-system, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Mono, SF Mono, Consolas, monospace"
    fontSize: "0.82rem"
    fontWeight: 500
rounded:
  focus: "6px"
  card: "24px"
  card-lg: "26px"
  pill: "999px"
  dome: "clamp(26px, 7vw, 96px)"
spacing:
  gutter: "clamp(20px, 4vw, 48px)"
  card-pad: "clamp(22px, 3vw, 32px)"
  step-pad: "clamp(24px, 3vw, 40px)"
  section-gap: "clamp(44px, 8vh, 96px)"
components:
  button-pill:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "14px 30px"
  button-pill-header:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "11px 22px"
  card-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  card-step:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card-lg}"
    padding: "{spacing.step-pad}"
---

# Design System: Pouncity

> Recorded from the shipped artifact `join-waitlist/index.html` (finish review disposition: ship, 2026-09-12). Screenshots of the shipped state live in `.impeccable/review/`.

## Overview

**Creative North Star: "The Poster-Scale Picture Book"**

Pouncity's waitlist world is a scroll-choreographed picture book starring flat-vector ink mascots at poster scale. The page is a sequence of full-bleed color fields — sun, cream, coral, ink — each carrying exactly one idea, joined by giant dome dividers. Every field wears a poster-scale tonal ghost line in its own darkened hue, so the type is scenery, not just copy. The mascots (Petbarn/Landor lineage: ink-black bodies, white googly eyes, coral accents) are the cast; their eyes track the cursor everywhere they appear, from the 12px pupils in the cat clowder to the giant hero dog.

The tone is warm, playful, and calm-by-default: delight comes from craft (character keyframe animation, a leash line drawn by scroll, a tennis ball that bounces in to celebrate) rather than noise or pressure. The system is fully flat — no box-shadows anywhere; grounding comes from flat translucent ellipse "contact shadows" under each character, and depth comes from the dome sections stacking over one another.

Recognizable with content removed: color-blocked fields, dome arches, ink mascots with googly eyes, coral pills with thick ink borders.

**Key Characteristics:**
- Four brand color fields (sun / cream / coral / ink) as full-bleed section backgrounds, each with a tonal ghost twin for poster type
- Fredoka poster display in uppercase with tight negative tracking; DM Sans body; DM Mono reserved for tiny system voices (cursor word, footer credit)
- Pill buttons: coral fill, 2.5px ink border, 999px radius, hover lift of -2px
- Flat-vector inline-SVG mascots with cursor-tracking googly eyes and CSS keyframe personality (blink, wag, sniff, thump, peek-pop)
- Motion as progressive enhancement: Lenis smooth scroll + GSAP ScrollTrigger/SplitText tumbles on fine pointers; complete static page with no JS or with reduced motion

## Colors

A four-anchor brand palette where every field color owns a darker tonal ghost for poster type sunk into that field.

### Primary
- **Sun Yellow** (#FFC93C): the brand's lead color — hero field, page background, theme-color, loader background, headline color on the ink field, focus outline on ink.
- **Burnt Sun** (#8F6500): tonal ghost twin of sun (3.4:1 on sun, AA-large only) — the hero poster headline and loader tagline. Poster type only, never body text.

### Secondary
- **Coral** (#FF6B4A): the action color — every pill button fill, mascot noses/tongues, the yarn-ball dot, the scroll-drawn leash line. Never used for text on light surfaces.
- **Deep Coral** (#D8492B): yarn-ball strand detail lines.
- **Coral Ember** (#7E1F0A): tonal ghost twin of coral (3.6:1, rendered at 40% opacity) — ghost type on the coral field only.
- **Ember Text** (#BF3A22): the AA-safe voice of coral on light surfaces (5.1:1 on cream) — step numbers, italic asides, paw-print accents, caret color. This is the ONLY coral allowed as text on sun/cream/panel.

### Neutral
- **Ink** (#161616): near-black anchor — all body text on light fields, mascot bodies, 2.5px component borders, the closing section field, scrollbar thumb, selection background.
- **Soft Ink** (#2B2B2B): tonal ghost twin of ink — ghost type on the ink field.
- **Cream** (#FFF7E6): warm off-white — second section field, text and wordmark on dark, light mascot fills (peek dog, bone, ball).
- **Panel Cream** (#FFFDF6): a half-step lighter than cream — card surfaces (steps, survey card) so cards read against the cream field.
- **Faded Cream** (#F1E3C2): tonal ghost twin of cream — ghost type on the cream field.
- **Eye White** (#FFFFFF): googly-eye whites and the cursor word (under mix-blend-difference).

### Named Rules
**The Tonal Ghost Rule.** Every field color carries its own darker (or, on ink, lighter) same-family twin for poster ghost type: sun→#8F6500, cream→#F1E3C2, coral→#7E1F0A at .4 opacity, ink→#2B2B2B. Ghost type is always tonal to its field — never a foreign hue, never readable-contrast body copy.

**The Ember Text Rule.** Coral #FF6B4A never appears as text on light surfaces; text that wants to be coral uses Ember Text #BF3A22 (5.1:1 on cream). Full coral is reserved for fills, strokes, and the coral field itself.

**The Ink Border Rule.** Interactive and card surfaces are bounded by a 2.5px solid ink border. No borderless buttons, no tinted borders on light fields (the dark field may swap the border to cream).

## Typography

**Display Font:** Fredoka (weights 500/600/700, sans-serif fallback)
**Body Font:** DM Sans (400/500/700, system sans fallback)
**Label/Mono Font:** DM Mono (400/500, monospace fallback)

**Character:** Rounded, chubby poster type that behaves like a mascot itself — uppercase, tightly tracked, nearly solid line-height — over a friendly geometric body face. DM Mono is a tiny system voice, not a headline device.

### Hierarchy
- **Display / Poster** (700, clamp(2.75rem, 11.5vw, 9.5rem), 0.96, -0.015em, UPPERCASE): the hero headline and section ghost lines (ghosts run clamp(3rem, 11–12vw, 9–10rem)). One per field.
- **Headline** (700, clamp(2.2rem, 6.5vw, 5rem), 1.02, -0.015em): section h2s. The close-field h2 goes uppercase in sun yellow at clamp(2.6rem, 8vw, 6.5rem).
- **Title** (Fredoka 600, clamp(1.5rem, 2.6vw, 2.1rem), 1.1): card headings; pillar rows use Fredoka 600 at clamp(1.45rem, 3.1vw, 2.5rem).
- **Step Number** (Fredoka 700, clamp(2.4rem, 5vw, 4rem), Ember Text #BF3A22, tabular numerals, "01." format): numeric anchors on step cards.
- **Body** (DM Sans 400–500, 16px/1rem, 1.5, max ~38ch): paragraphs; hero sub runs 500 at clamp(1rem, 1.4vw, 1.15rem).
- **Label** (DM Mono 500, 0.82rem / footer 0.64rem with .08em tracking, UPPERCASE in footer): the trailing cursor word and the footer credit ("© 2026 POUNCITY · 100% VECTOR FUR"). That is the entire DM Mono surface area.

### Named Rules
**The One Poster Per Field Rule.** Each color field carries exactly one poster-scale line — the hero's live headline, or a ghost line behind the content ("Sniff around." / "Almost house-trained." / "Good human."). Never two.

**The No Kicker Rule.** Headlines stand alone. The shipped page has no eyebrows or kickers above any heading, and DM Mono is never promoted to a heading-adjacent label.

## Layout

Single-column scroll story, no grid system. Content columns cap at 1180px (hero stage 1280px) centered inside a fluid page gutter of clamp(20px, 4vw, 48px). Vertical rhythm is viewport-relative: section padding builds on `calc(var(--dome) + 4–9vh)` so each dome overlap is paid for, and internal gaps use clamp(44px, 8vh, 96px)-class values.

- **Hero:** full viewport (min-height 100svh), flex column; the oversized dog (clamp(320px, 45vw, 700px)) rises from the bottom-right edge and overhangs into the next dome; floating toys (yarn, ball, bone) are absolutely placed props.
- **Pillar list:** alternating left/right rows (even rows reversed and right-aligned), prop icon clamp(64px, 8vw, 104px) beside a Fredoka line, max 760px per row.
- **Steps:** flex-wrapped cards (flex: 1 1 340px, max 520px) with counter-rotations (-1.4° / +1.6°) and a staggered top offset.
- **Close:** centered column, survey card max 560px, footer spans full width with a 1.5px translucent cream top border and safe-area bottom padding.
- **Breakpoints (max-width):** 900px drops the leash and shrinks the clowder; 720px stacks everything — rows go single-column, hero dog centers at min(88vw, 420px), CTA stretches full-width, scroll cue and two of three toys hide; max-height 820px compresses the hero poster.
- **Header:** fixed (absolute without JS), transparent, wordmark left / join pill right, recolored per section via `data-on` (dark field → cream wordmark and cream pill border; coral field → cream pill fill).

## Elevation & Depth

The system is completely flat: **no box-shadows anywhere**. Depth is conveyed three ways: (1) dome sections stack with rising z-index, each new field arching over the last; (2) mascots stand on flat translucent ellipse contact shadows (`fill: rgba(22,22,22,.12–.16)`); (3) hover states lift with transform (translateY(-2px)), not shadow.

### Named Rules
**The Ellipse Shadow Rule.** The only shadow in the world is a flat ink ellipse at 12–16% opacity under a character's feet. Never a CSS box-shadow, never a blur.

## Shapes

The form language is the dome and the pill. Sections join through a giant top arch — `border-radius: 50% 50% 0 0 / var(--dome)` with a negative margin of the same token (clamp(26px, 7vw, 96px)) — so every field rises into the previous one. Buttons are full pills (999px). Cards are generously rounded rectangles (24–26px) with 2.5px ink borders; step cards tilt ±1.4–1.6° like pinned paper. Cats are built from circles, ellipses, and thick round-capped strokes; dogs are drawn as single fluid Bézier silhouettes (see Mascots) — no sharp corners exist anywhere except the cats' triangle ears and the ink border weight itself. Focus rings are 3px solid ink (sun on the ink field), offset 3px, 6px radius.

## Components

### Buttons (Pill CTA)
- **Character:** chunky, toy-like, unmistakably pressable.
- **Shape:** full pill (999px), 2.5px solid ink border.
- **Primary:** coral #FF6B4A fill, ink text, Fredoka 600 at 0.95–1.06rem; padding 14px 30px (hero/close) or 11px 22px (header).
- **Hover / Focus:** translateY(-2px) with .15s ease; active returns to 0; focus-visible 3px ink outline offset 3px (sun outline on the ink field).
- **Context variants:** header pill turns cream-filled on the coral field and cream-bordered on the ink field. There is no ghost/secondary button — one button style, everywhere.

### Cards / Containers
- **Corner Style:** 24px (survey card) / 26px (step cards).
- **Background:** Panel Cream #FFFDF6, ink text — even inside the ink field.
- **Border:** 2.5px solid ink. **Shadow:** none (see Elevation).
- **Internal Padding:** clamp(22px, 3vw, 32px) survey / clamp(24px, 3vw, 40px) steps.
- **Attitude:** step cards rotate ±1.4–1.6° and stagger vertically.

### Navigation
- Transparent overlay header: lowercase Fredoka 700 wordmark "pouncity" with the coral yarn-ball dot, join pill right. Recolors per section field (`data-on="light|coral|dark"`) with a .4s color transition. Anchors smooth-scroll via Lenis when motion is on.

### Ghost Poster Type (signature)
- Absolutely positioned, non-interactive (pointer-events: none), white-space: nowrap Fredoka 700 uppercase line at clamp(3rem, 11–12vw, 9–10rem), tinted per the Tonal Ghost Rule, drifting ±5–6% horizontally on scroll (scrubbed parallax). Sits behind content (z-index 0–1) as scenery.

### Mascots (signature)
- Inline SVG, flat vector, ink #161616 bodies (cream on the ink field), white googly eyes (`.eye` group: white circle + ink pupil `.pp`). Pupils translate toward the cursor on fine pointers (max 3.6px, 11px for the hero `big` pupils); all eyes blink on staggered 4.7–7.3s cycles. Character verbs live in CSS keyframes: hero head sway + tail wag, cat tail flick, stander sniff-and-hop, sitter tail thump + ear flick, peek dog pop-up, walking-cat trot cycle. The "how" (SIT) field pairs a large and a small **sitting Barkley dog** (shared `sitterSVG()` template at two sizes) **facing each other** — the small one is mirrored with `transform: scaleX(-1)` — with a lone cat walking across the lane between them; the earlier running dog was replaced by the small sitter 2026-09-12. The sitting dog carries the full Barkley head from the user's pinned reference: a sharp pointy back ear **and** a floppy folded front ear, ring-outline googly eyes (white circle with a 2.5px ink stroke), a fat upswept tail, tapered muzzle. Coral is the accent (noses, tongues); speech bubbles are cream with 3px ink strokes.
- **The Dog Construction Rule (pinned 2026-09-12, Pinterest "Barkley" character-sheet reference; side-view dog traced 1:1 from it).** Dogs are one fluid silhouette, never assembled geometry: body, blunt muzzle, and skull flow as a single Bézier mass in a compact near-square footprint (the shared side-view template is `viewBox 0 0 224 214`, not a wide box). Signatures that must all be present, verified against the reference: **(1) a distinct tapered muzzle** that projects forward to a blunt nose with a slight chin notch underneath — never a rounded ball; **(2) two upright ears** — the standing/running side dog and the front heads (hero, peek) use a matching pair of pointy ears with rounded tips (the round floppy lobe was removed from them 2026-09-12 after reading as "a ball around the nose"). The **sitting dogs restore the canonical Barkley ears** from the user's pinned reference: a sharp pointy back ear plus a floppy folded front ear next to the muzzle, with a clear notch between (a deliberate divergence, chosen by the user for the sitters); **(3) a fat tapering brush tail** with a lightly frayed/notched tip, wide where it meets the rump — never a thin smooth sickle; **(4) four straight, slightly tapered legs** with small rounded nub feet, front pair and back pair split by a belly arch. The only white detail is the googly eye pair, set nearly touching. Cats keep the original circle-and-triangle-ear construction — the two species deliberately read differently. The side-view template faces right (its direction of travel for the running dog); the reference faces left, so it is mirrored — mirroring is identity-preserving and expected. **Rendering guard (2026-09-12):** every mascot `<svg>` — the side dog (`.stander` / `.runner`), both sitters, and the front heads (hero, peek) — must set `overflow:visible`. The muzzle, ear tips and tail brush deliberately extend past the traced viewBox, and the sniff / tail-thump / ear-flick keyframes push them further out; the SVG default `overflow:hidden` slices them into flat vertical cliffs (this exact cut returned once when the sitter snout was lengthened past the viewBox right edge, then was fixed). If a mascot ever looks sheared along a straight edge, check this rule before touching the path geometry.

### Trailing Cursor Word (signature)
- Fixed, mix-blend-difference, white DM Mono 0.82rem characters trailing the pointer with per-character lerp (0.32). The word is set per section (`data-cursor`): WAG! → SNIFF → SIT. → JOIN, and each section's mascot enacts its word. Hides over links/buttons and on coarse pointers.

### Preloader (signature)
- First visit + motion-OK only, gated by a pre-paint `html.pl` class and `localStorage('pouncity_seen')`. Sun field, Fredoka count-up ("Loading N%", clamp to 7.5rem), Burnt Sun tagline; exits upward in 650ms with a dome-shaped bottom edge; hard fail-safe at 2.6s. Total ≤ ~1.8s.

### Motion Grammar (applies to all of the above)
- **Stack:** Lenis (duration 1.15, fine pointers only) + GSAP ScrollTrigger + SplitText, activated only when `html.motion` is set (reduced-motion or missing libs → complete static page).
- **Reveal verbs:** SplitText char tumbles with random ±28° rotation and `back.out(1.4)` for poster lines; word tumbles (`power3.out`, y:70) for h2s; rows slide in from their reading side; cards rise with counter-rotation; characters pop with `back.out(1.6)`.
- **Ambient verbs:** toy float loops (sine, 2.6s+), scroll-velocity skew on toys (clamped ±8°), scrubbed leash-line draw, a cat walking across the coral field scrubbed to scroll (`#runner` lane).
- **Celebration:** clicking the survey CTA bounces the yarn ball in from off-screen (1.5s physics-flavored keyframes) and pops the hero dog's eyes — reward, never pressure.
- **Standard timings:** micro-interactions .15s ease; section color transitions .4s; loader exit `cubic-bezier(.65,.02,.35,1)`.

## Do's and Don'ts

### Do:
- **Do** give every new section a full-bleed field in one of the four anchors (sun / cream / coral / ink) joined by the dome divider (`border-radius: 50% 50% 0 0 / var(--dome)` + matching negative margin).
- **Do** use the field's tonal ghost twin for its poster line (The Tonal Ghost Rule) and Ember Text #BF3A22 for any coral-colored text on light surfaces.
- **Do** border every button and card with 2.5px solid ink, keep buttons as 999px coral pills, and lift on hover with translateY(-2px) only.
- **Do** ship every mascot as inline flat-vector SVG with googly `.eye` groups so cursor tracking and blink cycles apply automatically; ground it on a flat rgba(22,22,22,.12–.16) ellipse.
- **Do** build motion as an additive layer behind `html.motion`: page must read complete with no JS and under prefers-reduced-motion, and heavy layers (cursor, Lenis, runner lane) stay off coarse pointers.

### Don't:
- **Don't** use box-shadows, gradients, or photographic/raster imagery — the world is flat vector only ("100% VECTOR FUR").
- **Don't** add kickers or eyebrows above headings, or promote DM Mono beyond its two shipped roles (cursor word, footer credit).
- **Don't** put full coral #FF6B4A text on light surfaces, or ghost type in a hue foreign to its field.
- **Don't** invent social proof — no counts, testimonials, or press; belief is earned by craft and clarity.
- **Don't** hide content behind motion: nothing may require JS, hover, or scroll-triggering to be readable.
