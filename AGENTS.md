# Pouncity

A pet-care product for cats, dogs and their humans: one living **Diary** record
per pet that any **Caregiver** can be handed instantly. The public site
(marketing + waitlist) lives at the repo root; the signed-in owner app lives in
`V2/`. See `CONTEXT.md` for the shared vocabulary.

## Agent skills

### Issue tracker

Issues and tickets are tracked as local markdown under `.scratch/<feature>/issues/`; specs and backlogs live under `docs/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line in each ticket file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
