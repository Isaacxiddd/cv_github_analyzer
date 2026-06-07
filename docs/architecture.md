# Architecture

## Core Stack

| Layer | Tech | Why |
|-------|------|-----|
| **Runtime** | Manifest V3 service worker | Modern Chrome standard, better security model |
| **PDF parsing** | `pdfjs-dist` | Battle-tested, works in browsers, offline |
| **GitHub data** | REST API (public endpoints) | No auth needed for public profiles |
| **Testing** | Vitest + Node.js | Unit tests run in Node; mocked fetch |
| **Build** | esbuild + TypeScript | Fast, simple, no webpack/Babel overhead |

## Unidirectional Data Flow

```
pdf-parser
    ↓
cv-extractor (pure)
    ↓
github-fetcher (I/O)
    ↓
cross-checker (pure)
    ↓
report-generator (pure)
    ↓
popup.ts (render)
```

**Rule:** No circular imports, no backpressure.

## File Structure

```
extension/
├── src/
│   ├── types/
│   │   └── index.ts              ← All interfaces (single source of truth)
│   ├── data/
│   │   └── technologies.ts       ← 200+ known tech keywords
│   ├── parser/
│   │   ├── pdf-parser.ts         ← Calls pdf.js, returns raw text
│   │   ├── cv-extractor.ts       ← Orchestrates extraction
│   │   ├── skills-extractor.ts   ← Skill matching (pure)
│   │   ├── dates-extractor.ts    ← Date range parsing (pure)
│   │   └── links-extractor.ts    ← GitHub URL detection (pure)
│   ├── analyzer/
│   │   ├── github-fetcher.ts     ← Only file that calls fetch()
│   │   ├── cross-checker.ts      ← Orchestrates rules
│   │   └── rules/
│   │       ├── no-repos.ts       ← RED: skill in CV but no GitHub repos
│   │       ├── recent-only.ts    ← YELLOW: skill activity < 1 year
│   │       ├── years-mismatch.ts ← RED: claimed years vs GitHub evidence
│   │       ├── inactive.ts       ← YELLOW: no commits in 6 months
│   │       ├── no-readme.ts      ← YELLOW: >50% repos lack README
│   │       ├── no-tests.ts       ← YELLOW: >70% repos lack tests
│   │       ├── no-ci.ts          ← GRAY: >90% repos lack CI/CD
│   │       └── verified.ts       ← GREEN: skill confirmed in GitHub
│   ├── report/
│   │   └── report-generator.ts   ← Builds HTML from flags
│   ├── popup/
│   │   ├── popup.html            ← UI template
│   │   └── popup.ts              ← Event listeners, orchestration
│   ├── background/
│   │   └── background.ts         ← Service worker (thin orchestrator)
│   └── content/
│       ├── content.ts            ← Detects github.com, injects username hint
│       ├── portfolio-detector.ts ← Scans React SPAs for portfolio URLs
│       └── widget.ts             ← Floating widget UI
├── tests/
│   ├── fixtures/
│   │   ├── cv-samples/           ← .txt CV mockups
│   │   └── github-mocks/         ← JSON API responses
│   ├── cv-extractor.test.ts
│   ├── cross-checker.test.ts
│   └── report-generator.test.ts
├── build.ts                      ← esbuild config
└── package.json
```

## Architecture Rules

1. **Pure functions first** — parsers, analyzers, generators have zero side effects.
2. **One types file** — all interfaces in `src/types/index.ts`.
3. **Unidirectional flow** — no circular imports.
4. **Fetcher is the only I/O layer** — only `github-fetcher.ts` calls `fetch`.
5. **background.ts is an orchestrator** — it calls modules, no business logic.
6. **300-line cap** on entry files (`background.ts`, `index.ts`).
