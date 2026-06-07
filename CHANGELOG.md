# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-07

### Added
- Initial MVP release
- PDF CV parsing with pdf.js (client-side only, no upload)
- GitHub profile data fetching via public REST API (no auth)
- Skill gap detection between CV-listed skills and GitHub language usage
- Date inconsistency detection between CV employment dates and commit activity
- Portfolio URL detection in React SPAs (JS closure extraction)
- Commit quality signals (trivial commits, activity anomalies)
- Cross-check report generation with color-coded flags (RED/YELLOW/GREEN/GRAY)
- Score gauges for CV, GitHub, Coherence, and Global metrics
- Content script for auto-detecting GitHub usernames on github.com
- Service worker background orchestrator (Manifest V3)
- Analysis history panel with restore capability
- GitHub token configuration (PAT, optional, for higher rate limit)
- Portfolio URL scraper with auto-fill GitHub username
- Test suite: 38 tests across cross-checker, CV extractor, report generator
- TypeScript strict mode throughout

### Infrastructure
- esbuild bundler for Chrome Extension (Manifest V3)
- Vitest test framework with Node.js environment (no browser needed)
- ESLint + TypeScript-ESLint linting
- GitHub Actions CI: tests + typecheck + build on every push/PR
- pnpm workspace at root for unified commands
- Custom demo screenshot script (Playwright) for README

### Security
- 100% local processing: CV never leaves browser
- No analytics, no tracking, no telemetry
- Public GitHub API only (no private data access)
- Token stored in `chrome.storage.sync` (optional, user-managed)
- `SECURITY.md` with responsible disclosure policy
- `PRIVACY.md` detailing data flow

### Documentation
- Comprehensive README with problem/solution, architecture, usage, FAQ
- CONTRIBUTING.md with setup, code conventions, PR workflow
- CHANGELOG.md following Keep a Changelog
- CODE_OF_CONDUCT.md (Contributor Covenant)
- Issue templates (bug report + feature request)
- Pull request template with checklist
