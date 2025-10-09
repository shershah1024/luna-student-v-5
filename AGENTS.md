# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js 14 App Router pages, layouts, and API routes (e.g., `app/api/reading/*`, `app/tests/*`).
- `components/`: Reusable React components (PascalCase files), UI primitives in `components/ui/`.
- `lib/`, `utils/`, `hooks/`, `services/`: Shared logic, helpers, and service clients.
- `public/`: Static assets. `data/`, `docs/`, `scripts/` hold content, docs, and utilities.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server on `http://localhost:3000`.
- `npm run build`: Production build (increases Node memory for large builds).
- `npm start`: Serve the production build.
- `npm run lint`: Lint with Next/ESLint.
- `npm run format:check` / `format:write`: Prettier check/fix.
- Examples: `node test-ai-reading.js` (hits `app/api/reading/*`), `node scripts/check-pages.js` (Puppeteer page checks).

## Coding Style & Naming Conventions
- TypeScript, strict mode; prefer `const`/`let`, no `any` when avoidable.
- Indentation 2 spaces, Prettier defaults; sort imports via project plugin.
- File naming: routes and folders `kebab-case` (e.g., `app/api/generate-passage-audio`); components `PascalCase.tsx`.
- Use server components by default; add `"use client"` only when needed.

## Testing Guidelines
- No formal unit test runner; use provided scripts and manual verification.
- Start dev server, then run: `node test-ai-reading.js` to validate reading APIs.
- Headless checks: `node scripts/check-pages.js` or `check-pages-simple.js`.
- Keep test utilities under `app/tests/*`; name by feature (e.g., `listening/[test_id]/page.tsx`).

## Commit & Pull Request Guidelines
- Commits: concise, imperative. Prefer Conventional Commit style: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
- PRs: clear description, linked issues, screenshots or logs for UI/API changes, and steps to verify.
- CI gate locally: run `npm run lint`, `npm run build`, and relevant `node` tests before requesting review.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`. Do not commit secrets.
- Keys used in this repo can include Clerk, Supabase, Azure OpenAI, Sentry, and PostHog; ensure envs are set before API tests.
- Sentry is enabled in production builds only; review `next.config.js` before deploying.

