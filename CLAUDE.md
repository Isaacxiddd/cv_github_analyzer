# CV ↔ GitHub Analyzer

Chrome extension that cross-checks a PDF CV against a GitHub profile to detect skill inconsistencies, date mismatches, and code quality signals.

## Stack

| Layer | Tech |
|---|---|
| Extension | TypeScript + esbuild + Manifest V3 |
| PDF parsing | pdf.js (browser, popup context) |
| GitHub data | GitHub REST API (no auth in v0.1) |
| Testing | Vitest + Node environment |
| Backend (v1) | Fastify + Drizzle + PostgreSQL + Redis/BullMQ |
| AI (v1) | Claude API via `@anthropic-ai/sdk` — **backend only, never extension** |
| Dashboard (v1.1) | Next.js 15 + Tailwind + TanStack Query |

## Structure

```
extension/        ← Chrome extension (all v0.x work happens here)
  src/
    types/        ← index.ts: ALL shared interfaces live here
    parser/       ← pdf-parser.ts, cv-extractor.ts, tech-list.ts
    analyzer/     ← github-fetcher.ts, cross-checker.ts
    report/       ← report-generator.ts
    popup/        ← popup.html, popup.ts
    background/   ← background.ts (service worker, thin orchestrator)
    content/      ← content.ts (detects GitHub user on github.com)
  tests/
    fixtures/     ← cv-samples/*.txt, github-mocks/*.json
backend/          ← v1.0 SaaS (Fastify + DB + queue)
dashboard/        ← v1.1 recruiter UI (Next.js)
```

## Commands

```bash
cd extension
npm install
npm run dev        # esbuild watch → dist/
npm run build      # production build
npm run test       # Vitest (unit tests, Node env)
npm run typecheck  # tsc --noEmit
```

**Load in Chrome:** `chrome://extensions` → Developer mode → Load unpacked → select `extension/dist/`

## Architecture rules

1. **Pure functions first** — `cv-extractor`, `cross-checker`, `report-generator` have zero side effects. Easy to test without browser mocks.
2. **One types file** — all interfaces live in `extension/src/types/index.ts`. No local type definitions in modules.
3. **Unidirectional flow** — `pdf-parser → cv-extractor → github-fetcher → cross-checker → report-generator`. No circular imports.
4. **Fetcher is the only I/O layer** — `github-fetcher.ts` is the only file that calls `fetch`. Mock it in tests, never `fetch` directly.
5. **background.ts is an orchestrator** — it calls modules, it contains no logic. Same for backend `src/index.ts`.
6. **300-line cap on index/entry files** — if `index.ts` or `background.ts` grows past 300 lines, extract a service.
7. **Claude API only via backend** — never import `@anthropic-ai/sdk` in the extension.

## Adding a new cross-checker rule

1. Add `RuleId` to `src/types/index.ts`
2. Write a pure function `ruleXxx(cv, profile): Flag | null` in `cross-checker.ts`
3. Call it inside `runCrossCheck()` and push its result to `flags`
4. Add a test in `tests/cross-checker.test.ts` with a fixture that triggers it

## Roadmap

| Phase | Description |
|---|---|
| v0.1 | Local MVP: PDF parse + GitHub fetch + algorithmic cross-check |
| v0.2 | GitHub OAuth (5000 req/h, commit quality metrics) |
| v0.3 | Ollama local AI (optional narrative summary) |
| v1.0 | Backend SaaS: Fastify + PostgreSQL + BullMQ + Stripe + Claude API |
| v1.1 | Recruiter dashboard: Next.js, bulk analysis, export PDF/CSV |

## Environment variables (backend)

```
DATABASE_URL=postgres://...
REDIS_URL=redis://...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
ANTHROPIC_API_KEY=...
STRIPE_SECRET_KEY=...
JWT_SECRET=...
```

## Planned: Firebase Auth (v0.2)

When user identity is needed (e.g. saving reports, limiting free tier), add Firebase Authentication with Google sign-in.

### Approach

Use `chrome.identity.getAuthToken` to obtain a Google OAuth token, then exchange it for a Firebase credential:

```
chrome.identity.getAuthToken({ interactive: true })
  → Google OAuth token
  → GoogleAuthProvider.credential(token)
  → signInWithCredential(auth, credential)
```

This avoids `signInWithPopup` limitations in extension popups and works reliably with Manifest V3 service workers.

### Required changes

| File | Change |
|------|--------|
| `public/manifest.json` | Add `"identity"` back to `permissions`, add OAuth2 client ID in `oauth2` section |
| `src/auth/token-storage.ts` | Add Firebase config constants (apiKey, projectId, etc.) |
| `src/auth/firebase-auth.ts` | New file: `signInWithGoogle()`, `signOut()`, `onAuthStateChanged` wrapper |
| `src/popup/popup.html` | Replace or complement PAT section with Google Sign-In button |
| `src/popup/popup.ts` | Wire Firebase auth state into UI |
| `build.ts` | Add `define` for Firebase config env vars (or use `.env`) |

### Prerequisites

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google** sign-in in Authentication → Sign-in method
3. Enable the **Identity Toolkit API** in Google Cloud Console
4. Create OAuth 2.0 credentials (Web application type) in Google Cloud Console
5. Add the extension's Chrome Extension ID (from `chrome://extensions`) to the authorized redirect URIs:
   ```
   https://<extension-id>.chromiumapp.org/
   ```
6. In Firebase Project Settings → General → Add app → Web, copy the `firebaseConfig` object

### Caveats

- `chrome.identity.getAuthToken` requests the `https://www.googleapis.com/auth/userinfo.email` scope by default — adjust OAuth consent screen accordingly.
- The extension ID changes in development (different when unpacked vs. published in Chrome Web Store). Use separate Firebase projects for dev/prod or handle both redirect URIs.
- Firebase Admin SDK requires a backend (v1.0) for server-side operations like verifying ID tokens.
