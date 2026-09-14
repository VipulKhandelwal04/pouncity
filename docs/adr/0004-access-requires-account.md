# Reading a diary requires an account; the anonymous Viewer is retired

**Status:** accepted (2026-09-14). Supersedes the anonymous-viewer decision in **ADR-0003** (link-as-access); the single standing link, whole-link revoke, and per-diary / no-per-recipient-grant parts of 0003 carry forward.

A diary is readable **only** by its **Owner** and the signed-in **Caregivers** bound to it. Opening a **Handover link** or entering a **Referral code** while **signed out** shows a **sign-in gate** that reveals only the pet's name and a "Sign up to help with {pet}" action — no diary content. Signing up / in binds a **Caregiver** **Membership** to that diary (first time through `/sign-in`; an already-signed-in **Account** joins with one tap). The **Referral code** is a human-friendly form of the same standing link token, not a per-person invite. The Owner's "who has access" is now the **named Caregivers** list; the previous **"N recent opens"** anonymous count is **dropped**. Revoke stays **whole-link and per-diary**.

## Why this needs recording

ADR-0003 deliberately let anyone read a diary with **no account** ("open with no setup to view") and surfaced access as an aggregate **"N recent opens."** The product owner has since decided the opposite: **signed-out users see nothing**, and every helper is a **named account**. That reverses a load-bearing wedge from 0003, so the reversal — and what carries forward from 0003 — must be on record, or the reworked handover surface will read as a regression against the older ADR.

## Considered options

- **Keep anonymous viewing (ADR-0003 as-is)** — one tap to read, weak "N opens" signal, no accountability. Rejected: the owner wants named-only access and "signed out sees nothing."
- **Account required to read (chosen)** — the link/code leads to a gate; only Owner + bound Caregivers read. Gives named "who has access" and per-caregiver identity, at the cost of one sign-in before a helper can see anything.
- **Per-person invite codes** — a distinct code/grant per recipient. Rejected for the pilot: the Referral code is the *same* standing link in human-friendly form, keeping issue/revoke simple (whole-link). Per-recipient grants and per-caregiver removal remain a v2 question.

## Consequences

- The built handover view (`/d/[token]`, ticket 07) becomes a **sign-in gate**; the anonymous **Viewer** role and the `recentOpens` counter are retired (glossary + seam).
- The Share/admin surface (ticket 08) drops "recent opens" and shows the **named Caregivers** list; revoke unbinds caregivers on that diary only.
- Enables the **dual-role** model: an **Account** can be an Owner of its own diary and a Caregiver on others'; a caregiver-only Account owns none. Feeding confirms attribute to the Account **name**.
- Glossary (`CONTEXT.md`): adds **Account**, **Membership**, **Referral code**; reframes **Owner** / **Caregiver** as per-diary roles; **retires Viewer**; rewrites **Access** and **Handover link**.
- Build is tracked in `.scratch/pouncity-accounts/issues/` (this epic reworks tickets 07–09 of `.scratch/pouncity-app/issues/`).
