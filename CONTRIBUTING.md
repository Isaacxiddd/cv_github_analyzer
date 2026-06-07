# Contributing to CV ↔ GitHub Analyzer

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/cv_github_analyzer.git
   cd cv_github_analyzer
   ```
3. Install dependencies:
   ```bash
   cd extension
   npm install
   ```
4. Create a branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

## Development Workflow

```bash
cd extension
npm run dev          # esbuild watch → dist/
npm run test         # run tests
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

### Loading in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `extension/dist/`

## Code Conventions

- **Pure functions first** — no side effects in parsers, analyzers, or generators
- **One types file** — all interfaces in `extension/src/types/index.ts`
- **Unidirectional flow** — `pdf-parser → cv-extractor → github-fetcher → cross-checker → report-generator`
- **Fetcher is the only I/O layer** — only `github-fetcher.ts` calls `fetch`
- **300-line cap** on entry files (`background.ts`, `index.ts`)
- **Strict TypeScript** — `strict: true` in tsconfig

### Style

- TypeScript with `strict` mode
- No `any` — use proper types or `unknown`
- Descriptive variable names, no abbreviations
- 2-space indentation
- Semicolons required

## Testing

- All pure functions must have tests
- Mock `github-fetcher.ts` only — never `fetch` directly in tests
- Run tests: `npm run test`
- Coverage: `npm run test -- --coverage` (aim for ≥70%)

### Fixtures

Add test fixtures under `extension/tests/fixtures/`:
- `cv-samples/*.txt` for CV parsing edge cases
- `github-mocks/*.json` for GitHub API responses

## Pull Request Process

1. Update `CHANGELOG.md` with your change under "Unreleased"
2. Ensure all tests pass: `npm run test`
3. Ensure type checking passes: `npm run typecheck`
4. Ensure linting passes: `npm run lint`
5. Open a PR against `main` with a clear title and description

### PR Checklist

- [ ] Tests added/updated
- [ ] TypeScript strict checks pass
- [ ] Lint passes
- [ ] CHANGELOG updated
- [ ] No hardcoded secrets

## Adding a Cross-Check Rule

1. Add `RuleId` to `extension/src/types/index.ts`
2. Write a pure function `ruleXxx(cv, profile): Flag | null` in `cross-checker.ts`
3. Call it inside `runCrossCheck()` and push its result to `flags`
4. Add a test in `tests/cross-checker.test.ts` with a fixture that triggers it

## Issues

- **Bug reports** — use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature requests** — use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- **Security** — see [SECURITY.md](SECURITY.md)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).
