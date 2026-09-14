# Pouncity

Pouncity is a pet-care product for cats, dogs and their humans: one living "diary" record per pet that any caregiver can be handed instantly. This glossary covers both the public **site** (marketing + the pre-launch waitlist) and the signed-in **app**. The two `.docx` specs cover the app only; the site vocabulary below was settled in a design session.

## Site

**Home**:
The permanent marketing front door of the site, at `/`. One surface with a swappable primary call-to-action: it shows **Waitlist mode** before launch and **Live mode** after.
_Avoid_: landing page, waitlist page (as separate things)

**Waitlist mode**:
The pre-launch state of **Home**, where the primary CTA is the survey sign-up. At launch it flips to **Live mode** (CTA becomes "create your pet's diary"); everything else on Home stays the same.
_Avoid_: the waitlist page, join-waitlist

**Live mode**:
The post-launch state of **Home**, where the primary CTA is "create your pet's diary" → **Sign-in**, and a "Sign in" link appears in the header. Selected by the same flag that drives **Waitlist mode**.
_Avoid_: launched page, prod mode

**How it works** (the band):
The Home band that explains how the **product** works for a pet owner — create diary → AI diet & grooming plan → one daily tap → hand off to a sitter. It is about the product, never the survey mechanic.
_Avoid_: "How joining works"

**Sign-in**:
The passwordless front door to the **App** (email magic link or Google; no passwords). Distinct from **Home**.
_Avoid_: login page, auth page

## App

**App**:
The signed-in product behind **Sign-in**: diaries, AI/manual diet & grooming plans, daily tracking, and handover. Every person using it has an **Account**, and the app is dual-role — the same Account can own a pet's diary and help with other people's pets at the same time. Distinct from the public **site**.

**Account**:
The identity of a person using the **App** — an id, a display **name** (asked once at first sign-in), and an email. This is the "user profile." An Account relates to diaries through **Memberships**: it may be the **Owner** of its own **Diary** and a **Caregiver** on any number of others', simultaneously. A **caregiver-only** Account owns no diary at all.
_Avoid_: user; profile (that word stays reserved so it never means the pet's **Diary**)

**Diary**:
The single living record for one pet (name, species, breed, age, weight, photo, plus optional quirks, vet contact, diet plan, grooming guide, records, logs). **One diary per owner Account in the pilot** — but an Account may still be a **Caregiver** on many others' diaries.
_Avoid_: passport, profile, record, pet page

**Membership**:
The bond between an **Account** and a **Diary**, carrying a **role**: **Owner** or **Caregiver**. An Account holds one Owner membership (its own pet, in the pilot) and zero-or-more Caregiver memberships (other owners' pets). Roles are per-diary, never global.
_Avoid_: role (on its own), grant, permission

**Owner**:
The **Membership** role of the Account that created a **Diary** — the only role that can edit the diary, manage or revoke its sharing, and see its admin **records** (desexing / registration / rabies). Per-diary: the same person is a **Caregiver** on diaries they didn't create, and administering access is just the Owner administering their own diary, not a separate super-admin.
_Avoid_: admin (there is no separate admin), primary caregiver, "a different person from the caregiver"

**Caregiver**:
The **Membership** role of a signed-in **Account** bound to a **Diary** via its **Handover link** / **Referral code**. A Caregiver can log the daily **Feeding confirm** (attributed to their name) and opt into reminders, and read the pet basics, diet plan, grooming guide, quirks and vet contact — but **cannot** edit the diary, manage sharing, or see admin **records**. One Account can be a Caregiver on many diaries from different Owners. Access ends when that diary's Owner revokes its link.
_Avoid_: sitter (that's one context for a caregiver), viewer, user, helper

**Viewer** — *retired 2026-09-14 (see ADR-0004)*:
There is no anonymous access. Formerly anyone opening a **Handover link** could read a diary with no account; now opening it while signed out reaches a **sign-in gate**, and only a signed-in **Owner** or **Caregiver** can read a diary. Kept here only so older references resolve.
_Avoid_: reviving anonymous read

**Access** (to a diary):
A diary is readable only by its **Owner** and the **Caregivers** bound to it — **access requires an Account** (ADR-0004). It is granted by the diary's standing **Handover link** / **Referral code**: opening it signed-out reaches a gate; signing in binds a **Caregiver** membership. "Who has access" resolves to the named Caregivers (there is **no anonymous count**). Revoke is **whole-link and per-diary**: it unbinds every Caregiver on that diary at once and leaves their memberships on other diaries untouched. The pilot's "flat" model means no field-level redaction *within a role*, but Owner and Caregiver differ in what they can see and do.

**Handover link**:
The standing, non-expiring unit of **Access** to one diary. It grants **no anonymous read** — opening it leads to a sign-in gate showing only the pet's name and "Sign up to help." The **Owner** revokes it manually (per-diary); a fresh one can then be issued. Its human-friendly twin is the **Referral code**.
_Avoid_: share link, invite

**Referral code**:
A short, human-friendly form of the **same** standing Handover-link token (easy to read out over a call or chat). Entering it — on the public gate, or via "Join a pet with a code" inside the app — is equivalent to opening the link. It changes only when the Owner regenerates or revokes the link; it is **not** a per-person invite and carries no separate expiry.
_Avoid_: invite code (it is the same link, not per-recipient), promo code

**Feeding confirm**:
The once-per-day, per-diary record that the pet was fed. Idempotent (one per day; a repeat is a no-op), reversible the same day, attributed to whoever logged it (**Owner** or **Caregiver**, by **Account** name), with an optional free-text deviation note. A binary confirm, not quantity logging.
_Avoid_: feeding log entry, meal record, "the daily tap" (that names the UI affordance, not the record)
