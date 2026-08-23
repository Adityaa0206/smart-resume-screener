# Phase 1 Notes — Backend Foundation + Core Logic

## Environment disclosure (read this first)

This project was built inside Claude's sandboxed Linux container, **not**
directly on your Windows machine. Two consequences:

1. **No network access.** `npm install` could not be run to fetch real
   dependencies (express, zod, openai, pdf-parse, @prisma/client, vitest,
   etc.) — the registry request was refused (`403 host_not_allowed`) by the
   sandbox's egress policy. This is normal/expected for this environment,
   not a project bug.
2. **No access to `D:\Project`.** The project was built at
   `/home/claude/smart-resume-screener` inside the sandbox and packaged into
   a ZIP for you to extract to `D:\Project\smart-resume-screener` yourself.

Because of (1), **`npm install`, `npm run build`, `npm test`, and `npm run dev`
have not actually been executed against the real toolchain in this
environment.** Do not take this project's presence as proof it runs — you
need to run the commands below yourself, once, after extracting the ZIP:

```bash
cd backend
npm install
npx prisma generate
npm run build
npm test
```

If anything fails, it's most likely one of: a version mismatch in
`package.json` ranges, or a TypeScript error that only becomes visible once
real type definitions are resolved (see "What was actually verified" below
for exactly which risk areas are unconfirmed).

## What WAS actually verified in this environment

- **TypeScript compiles with real dependencies temporarily simulated.**
  The sandbox's global TypeScript is a newer major version (6.0.3) than the
  one this project pins (^5.6.2), and it treats this project's
  `moduleResolution`/`baseUrl` combination as a *fatal config error* rather
  than a warning — meaning an early check of "does `tsc` report zero
  errors?" was silently checking nothing at all (tsc aborted before
  reading any source file). This was caught and is documented here rather
  than glossed over. After correcting for that (a temporary local
  compatibility flag, not committed to the project), `tsc` did run for
  real and read every `.ts` file.
- With that real run, the only errors reported were "cannot find module
  X" for the packages not installed (express, zod, cors, openai,
  pdf-parse, @prisma/client) and "cannot find name process/console/Buffer"
  from missing `@types/node` — both categories are expected to disappear
  once `npm install` actually runs, and are not evidence of a code bug.
- A handful of "implicit any" errors also appeared, but by inspection they
  are all downstream of the same missing-module problem (e.g. a callback
  parameter typed from a zod-inferred type that resolves to `any` only
  because `zod` itself isn't resolvable yet). These were manually traced,
  not just assumed — see the specific lines checked in `llm.service.ts`,
  `semanticMatching.service.ts`, `scoring.service.ts`, and
  `errorHandler.ts`.
- A real, non-cosmetic bug **was** caught and fixed this way: the original
  `tsconfig.json` set `rootDir: "src"` while also including `tests/**/*.ts`,
  which would have broken `npm run build`. Fixed by splitting into
  `tsconfig.json` (editor/vitest, includes tests) and `tsconfig.build.json`
  (production build, `src` only). `npm run build` now points at the latter.
- The deterministic scoring logic (`scoring.service.ts`) was manually
  hand-calculated against every test case in `tests/unit/scoring.test.ts`
  (the weighted-average formula, the experience interpolation curve, and
  the mandatory-requirement-override rule for the Kubernetes/Docker
  scenario) to confirm the arithmetic matches the expected test
  assertions. This is not the same as running the test suite, but it is a
  genuine independent check of the logic, not a guess.
- Directory structure, file creation, and `git init` were verified with
  real filesystem commands (`ls`, `git status`), not assumed.

## What was NOT verified (be aware of this before you rely on it)

- The test suite (`vitest`) has never actually executed. The tests are
  written to real, specific behavior (not coverage padding), and I traced
  the scoring tests by hand, but I have not watched them pass.
- `npm install` has never succeeded — dependency version ranges in
  `package.json` (e.g. `openai@^4.60.0`, `pdf-parse@^1.1.1`,
  `@prisma/client@^5.20.0`) have not been confirmed to resolve together
  without conflicts.
- `npx prisma generate` has never run — the Prisma schema has not been
  validated by the actual Prisma CLI.
- The Express server has never actually been started and hit with a real
  HTTP request; the health-check test asserts the expected shape but was
  not executed.
- The `pdf-parse` library's real parsing behavior against a real corrupt
  PDF was not observed (the test exercises this path but wasn't run).

**Do not tell an interviewer "fully tested" about Phase 1** — tell them
exactly this: core logic was written test-first with specific behavioral
tests, the scoring math was hand-verified, a real config bug was caught by
inspection, but the suite has not been executed end-to-end because the
build sandbox had no network access. You'll run the real suite yourself
after extracting the project, which is normal for any handoff like this.

## What Phase 1 delivers

- Full project scaffold (backend only, per phase scope): TypeScript,
  Express, Prisma+SQLite schema, zod schemas for every domain object,
  vitest config.
- Domain types/schemas: `ParsedResume`, `ParsedJobDescription`,
  `RequirementMatch` (with the 4-category relationship model and its
  deterministic credit table), `ScreeningResult`/`ScoreBreakdown`.
- Services: PDF/text extraction (`pdfExtraction.service.ts`), resume
  extraction (`resumeExtraction.service.ts`), JD extraction
  (`jdExtraction.service.ts`), semantic matching
  (`semanticMatching.service.ts`), deterministic scoring
  (`scoring.service.ts`), and the single OpenAI wrapper
  (`llm.service.ts`) that every LLM call goes through.
- Every LLM-facing service has a **demo/fallback mode** (active whenever
  `OPENAI_API_KEY` is unset) that uses deterministic, rule-based logic
  instead — so the pipeline can be exercised without any API key or cost.
  Fallback usage is always flagged in the return value
  (`usedFallback: true`).
- Explicit, non-hidden scoring weights in `config/scoring.config.ts`
  (40/25/15/10/10 as specified), plus the mandatory-requirement-override
  rule implemented as real code + a dedicated test, not just prose.
- Express app with `/api/health`, consistent error-response shape via
  central error middleware, and a 404 handler. `/api/screen` and
  `/api/candidates*` are explicitly **not** built yet — Phase 2 scope.
- 9 test files covering: PDF/text parsing incl. empty/corrupt input, skill
  normalization + aliasing, demo-mode resume/JD extraction (incl. "don't
  invent data" checks), semantic matching for all four relationship
  categories (with the Kubernetes/Docker case called out explicitly),
  deterministic scoring incl. the mandatory-override rule, candidate
  ranking, and malformed/failing LLM response handling.

## What's explicitly deferred to Phase 2 (per your instructions)

- `POST /api/screen` orchestration (wiring parser → extraction → matching
  → scoring → persistence together)
- Database read/write (Prisma client usage — schema exists, but nothing
  calls it yet)
- `GET /api/candidates`, `GET /api/candidates/:id`
- Realistic sample resumes/JD (`sample_data/` is currently just a
  placeholder note)
- API/integration tests against a running server + real DB
