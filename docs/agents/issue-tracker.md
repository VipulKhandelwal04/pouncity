# Issue tracker: Local Markdown

Issues, tickets, and specs for this repo live as markdown files in `.scratch/`
and `docs/` (not GitHub Issues, though the repo has a GitHub remote).

## Conventions (how this repo already works)

- One effort per directory: `.scratch/<feature-slug>/` (e.g. `.scratch/pouncity-accounts/`, `.scratch/pouncity-app/`)
- Implementation tickets are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- **Specs** live at `docs/spec-<feature>.md` and **backlogs** at `docs/backlog-<feature>.md` — this repo keeps long-form specs under `docs/`, alongside `CONTEXT.md` and `docs/adr/`
- Triage state is recorded as a `Status:` line near the top of each ticket file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of a ticket under a `## Comments` heading

## When a skill says "publish to the issue tracker"

- A **spec** → write `docs/spec-<feature>.md`
- **Tickets** → write `.scratch/<feature-slug>/issues/NN-<slug>.md` (creating the directory if needed)

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the ticket number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
