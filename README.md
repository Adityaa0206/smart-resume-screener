# Smart Resume Screener

> **Status: Phase 1 of 3 complete.** See `PHASE1_NOTES.md` for what was built,
> what was verified, and what remains. The full README (architecture,
> setup, API docs, design decisions, etc.) is written progressively and will
> be finalized at the end of Phase 3, per the project's phased build plan.

## Phases

- [x] **Phase 1** — Backend foundation + core logic (parsing, extraction,
      semantic matching, deterministic scoring, LLM wrapper, unit tests)
- [ ] **Phase 2** — Complete API, database persistence, sample data,
      integration tests
- [ ] **Phase 3** — React recruiter dashboard + final integration

## Quick start (Phase 1 backend only)

```bash
cd backend
npm install
cp .env.example .env      # add your OPENAI_API_KEY, or leave blank for demo mode
npx prisma generate
npm run build
npm test
npm run dev
```

See `PHASE1_NOTES.md` for details on what has and hasn't been run/verified
in the build environment.
