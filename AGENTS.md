# AGENTS.md

## Stack

- **Runtime:** Bun (not Node) — runs TypeScript directly, no transpile step for backend
- **Backend:** Hono on Bun, SQLite via bun:sqlite + Drizzle ORM, Better Auth
- **Frontend:** Vue 3 SPA + Pinia + Vue Router (history mode), Tailwind CSS 4 (Vite plugin)
- **Bot:** grammY — one Telegram bot instance per user, long-polling
- **Package manager:** Bun (`bun install`, lockfile is `bun.lock`)

## Commands

```bash
bun install              # install deps
bun run dev              # backend (:3000) + Vite frontend (:5173) in parallel
bun run dev:server       # backend only (--watch)
bun run dev:frontend     # Vite only
bun run build            # Vite builds frontend to dist/frontend/
bun run start            # production server (NODE_ENV=production)
bun test                 # run tests (none exist yet)
bun run typecheck        # vue-tsc --noEmit (covers both frontend and server types)
bun run db:generate      # generate Drizzle migration after schema changes
bun run db:migrate       # apply migrations
bun run db:studio        # Drizzle Studio GUI
```

No linter or formatter is configured.

## Project layout

```
src/
  server/    — Hono API routes, auth guards, middleware
  frontend/  — Vue 3 SPA (views, components, composables, stores, i18n, router)
  db/        — Drizzle schema + migrations (SQLite)
  bot/       — Telegram bot manager (multi-user, grammY)
  shared/    — types.ts + validators.ts (Zod schemas) used by both frontend and backend
data/        — runtime data dir (SQLite DB, screenshots)
dist/        — build output (frontend only)
```

## Path aliases (tsconfig)

`@server/*`, `@db/*`, `@frontend/*`, `@shared/*`, `@bot/*` — all map to `src/<name>/*`. Use these in imports.

## Database workflow

1. Edit `src/db/schema.ts`
2. `bun run db:generate` — creates a new SQL migration in `src/db/migrations/`
3. Migrations run automatically on server startup (`src/server/index.ts`)

SQLite DB lives at `./data/keepomat.db` (configurable via `DATABASE_URL`).

## Environment

Copy `.env.example` to `.env`. Required variables:

- `BETTER_AUTH_SECRET` — auth signing secret
- `BETTER_AUTH_URL` — public-facing URL (used for CORS origins)

Optional: `PORT` (default 3000), `TRUSTED_ORIGINS`, AI provider keys, `TELEGRAM_BOT_TOKEN`.

## Architecture notes

- Backend serves the built SPA as static files in production; Vite proxies `/api` to `:3000` in dev.
- Auth uses Better Auth with email/password. API keys (hashed) provide an alternative auth path for the userscript and Telegram bot.
- Shared Zod validators in `src/shared/validators.ts` are the source of truth for API request shapes — keep them in sync when changing routes.
- Telegram bots are started per-user at server startup and managed via a global `Map<userId, Bot>`. Changing bot logic in `src/bot/index.ts` affects all users.
- FTS5 virtual table is created at startup for bookmark search — it is not in Drizzle schema, managed manually in server code.

## CI

GitHub Actions (`.github/workflows/docker.yml`) builds multi-arch Docker images on push to `main` or version tags. No CI test/lint step.

## Behavioral guidelines

Guidelines to reduce common LLM coding mistakes. Biased toward caution over speed — use judgment for trivial tasks.

### Think before coding

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity first

- No features beyond what was asked.
- No abstractions for single-use code.
- No speculative "flexibility" or "configurability".
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.

Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical changes

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### Goal-driven execution

Transform tasks into verifiable goals:
- "Add validation" → write tests for invalid inputs, then make them pass
- "Fix the bug" → write a test that reproduces it, then make it pass
- "Refactor X" → ensure `bun run typecheck` passes before and after

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require clarification first.
