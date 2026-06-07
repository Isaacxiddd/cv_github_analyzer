# CV ↔ GitHub Analyzer

[![Tests](https://github.com/Isaacxiddd/cv_github_analyzer/actions/workflows/test.yml/badge.svg)](https://github.com/Isaacxiddd/cv_github_analyzer/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen)](https://developer.chrome.com/docs/extensions/mv3/)

> **Catch CV lies before the interview.** This Chrome extension cross-checks your PDF CV against your GitHub profile in real-time, flagging skill gaps, date mismatches, and code quality signals — all locally in your browser.

---

## Problem

CVs and GitHub profiles drift apart:

- ✋ "Expert in React" but GitHub shows zero React commits in 2 years
- ✋ "5 years Python" but first Python repo was last month
- ✋ Claimed contributions to big projects, but commits are trivial comments
- ✋ Listed skills with no code evidence to back them up

## Solution

Upload your PDF CV. Enter your GitHub username. Get a detailed report of inconsistencies **in seconds**, right in your browser.

<p align="center">
  <img src="screenshots/demo.png" alt="Demo screenshot" width="360">
</p>

**Key principle:** All processing happens in your browser. No data upload, no tracking. [Full privacy policy →](docs/privacy.md)

---

## Quick Start

```bash
cd extension
npm install
npm run build
```

Then in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `extension/dist/`

---

## Usage

1. Click the extension icon in your Chrome toolbar
2. Drop your PDF CV into the popup
3. Enter a GitHub username (e.g. `torvalds`)
4. Click **Analyze**
5. Review flagged inconsistencies with evidence

### Example Report Flags

```
🔴 [NO_REPOS]       "Expert React" → GitHub shows 0 React repos
🔴 [YEARS_MISMATCH] "5 years Python" → first Python repo was 1 year ago
🟡 [INACTIVE]        No commits in the last 6 months
🟢 [VERIFIED]        TypeScript confirmed in GitHub (65% of recent commits)
```

---

## Features (v0.1)

| Feature | Description |
|---------|-------------|
| **Skill Gap Detection** | CV lists "Python" → GitHub shows no Python repos → flagged |
| **Date Mismatch Detection** | Employment dates vs. commit activity timeline |
| **Portfolio URL Detection** | Extracts URLs from CV, finds corresponding GitHub repos |
| **Commit Quality Signals** | Detects trivial commits, high-frequency activity anomalies |
| **8 Cross-Check Rules** | [See full catalog →](docs/rules.md) |
| **38 Unit Tests** | [View test suite](extension/tests/) |
| **100% Local** | No backend, no data upload, no tracking |

---

## Project Structure

```
extension/
├── src/
│   ├── types/          ← All interfaces
│   ├── data/           ← Technology keywords
│   ├── parser/         ← PDF, skills, dates, links
│   ├── analyzer/       ← GitHub fetcher + cross-check rules
│   ├── report/         ← HTML report generator
│   ├── popup/          ← Extension UI
│   ├── background/     ← Service worker
│   └── content/        ← GitHub page integration
├── tests/
│   ├── fixtures/       ← CV samples + GitHub mocks
│   ├── cross-checker.test.ts
│   ├── cv-extractor.test.ts
│   └── report-generator.test.ts
└── build.ts            ← esbuild config
```

[Full architecture →](docs/architecture.md) | [Engineering decisions →](docs/decisions.md)

---

## Development

```bash
cd extension
npm install
npm run build       # Production build
npm run dev         # Watch mode
npm run test        # 38 unit tests
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
```

---

## Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| **v0.1** | Local MVP: PDF parse + GitHub fetch + cross-check | ✅ Current |
| **v0.2** | GitHub OAuth + commit quality metrics | 🔜 Q3 2026 |
| **v0.3** | Ollama local AI (optional narrative summary) | 🔜 |
| **v1.0+** | Backend SaaS + recruiter dashboard | 📋 Future |

[Full roadmap →](ROADMAP.md) | [Future architecture →](docs/roadmap.md)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, code conventions, and PR workflow.

---

## License

[Apache License 2.0](LICENSE) © 2025 Isaac Garcia
