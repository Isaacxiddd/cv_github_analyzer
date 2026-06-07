# CV ↔ GitHub Analyzer

[![Tests](https://github.com/Isaacxiddd/cv_github_analyzer/actions/workflows/test.yml/badge.svg)](https://github.com/Isaacxiddd/cv_github_analyzer/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-brightgreen)](https://developer.chrome.com/docs/extensions/)

> Cross-check PDF CVs against GitHub profiles — detect skill gaps, date mismatches, and code quality signals.

<img src="screenshots/demo.png" alt="Demo" style="max-width:100%;max-height:480px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1)">

## Quick Start

```bash
cd extension
npm install
npm run build
```

Load in Chrome: `chrome://extensions` → Developer mode → **Load unpacked** → select `extension/dist/`

## How It Works

1. **Upload a PDF CV** — parsed locally with pdf.js (nothing leaves your browser)
2. **Enter a GitHub username** — fetches public profile data via GitHub REST API
3. **Get a cross-check report** — flags inconsistencies in skills, dates, and code quality

## Features

- **Skill Gap Detection** — compares CV-listed skills against GitHub language/repo usage
- **Date Mismatch Detection** — cross-references employment dates with commit activity
- **Portfolio Detection** — finds GitHub URLs in React SPAs (even in JavaScript closures)
- **100% Local (v0.1)** — no backend, no data upload, no tracking

## Project Structure

```
extension/        ← Chrome Extension (all v0.x work)
backend/          ← v1.0 SaaS (Fastify + PostgreSQL)
dashboard/        ← v1.1 Recruiter UI (Next.js)
```

## Roadmap

| Phase | Description |
|---|---|
| v0.1 | **Current** — Local MVP: PDF parse + GitHub fetch + algorithmic cross-check |
| v0.2 | GitHub OAuth (5000 req/h, commit quality metrics) |
| v0.3 | Ollama local AI (optional narrative summary) |
| v1.0 | Backend SaaS: Fastify + PostgreSQL + BullMQ + Stripe + Claude API |
| v1.1 | Recruiter dashboard: Next.js, bulk analysis, export PDF/CSV |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, code conventions, and PR workflow.

## License

[Apache-2.0](LICENSE) © 2025 Isaac Garcia
