# Roadmap — Portfolio

## Now
- **Adopt into our standard** (building) — Portfolio came in with its history; our docs, rules and QA come from what its code really is.
  Goal: our docs, rules and a real QA, written from what the code really is (the work skill's adopt mode); no product code changes.
  In:
  - PRODUCT.md, ARCHITECTURE.md, AGENTS.md, ROADMAP.md and docs/IDEAS.md from the code; each existing doc (README, AGENTS.md, CLAUDE.md, docs/) folded in, kept or removed, every choice listed.
  - `.jarvis/qa.mjs`: the stack's real checks (install, lint, typecheck, build, the tests it has), writing .qa/qa-report.json; jarvis.json's stack, commands and personal_data (the paths that touch personal data, for the ship's LGPD check) set.
  - A database: a local stack from the repo's schema with seed data, or what's missing said.
  Out: product code changes, deploy integrations, moving secrets; env files are never read and nothing runs against a live service.
  Done when:
  - The docs and the QA describe the real project, and the full QA runs (its failures, if any, listed in Fixes and chores).
  - The summary lists every doc choice and flags the production risks found (live keys in config, a deploy that runs on push to main).

## Next

## Later

## History
