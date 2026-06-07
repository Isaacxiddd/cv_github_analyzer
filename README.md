# CV ↔ GitHub Analyzer

[![Tests](https://github.com/Isaacxiddd/cv_github_analyzer/actions/workflows/test.yml/badge.svg)](https://github.com/Isaacxiddd/cv_github_analyzer/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen)](https://developer.chrome.com/docs/extensions/mv3/)

> **Catch CV lies before the interview.** This Chrome extension cross-checks your PDF CV against your GitHub profile in real-time, flagging skill gaps, date mismatches, and code quality signals — all locally in your browser.

---

## Problem

Recruiters and hiring managers spend 6–8 seconds on each CV. But that's not where the real risk is.

The real problem: **CVs and GitHub profiles drift apart.**

- ✋ "Expert in React" but GitHub shows zero React commits in 2 years
- ✋ "5 years Python" but first Python repo was last month  
- ✋ Claimed contributions to big projects, but commits are trivial comments
- ✋ Listed skills with no code evidence to back them up

**Current approach:** Manual Ctrl+F, GitHub stalking, gut feeling.  
**Better approach:** Algorithmic, transparent, and automatic.

---

## Solution

Upload your PDF CV. Enter your GitHub username. Get a detailed report of inconsistencies **in seconds**, right in your browser.

### What it does

```
┌─────────────────────────────────────────────────────────────────┐
│ Your CV (PDF)                                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Extract skills, dates │
         │ & project claims      │
         └───────────┬───────────┘
                     │
                     ▼
         ┌──────────────────────────┐
         │ Fetch GitHub public data │
         │ (REST API, no auth)      │
         └──────────┬───────────────┘
                    │
                    ▼
       ┌────────────────────────────────┐
       │ Cross-check algorithmically:   │
       │ • Skill gap detection          │
       │ • Date & timeline alignment    │
       │ • Portfolio repo detection     │
       │ • Commit quality signals       │
       └──────────┬─────────────────────┘
                  │
                  ▼
       ┌─────────────────────┐
       │ Detailed HTML report│
       │ (flagged issues)    │
       └─────────────────────┘
```

**Key principle:** All processing happens in your browser. No files are uploaded. No data is sent to servers. No tracking.

<p align="center">
  <img src="screenshots/demo.png" alt="Demo screenshot" width="360">
</p>

---

## Features

| Feature | Status | Details |
|---------|--------|---------|
| **Skill Gap Detection** | ✅ v0.1 | CV lists "Python" → GitHub shows no Python repos → flagged |
| **Date Mismatch Detection** | ✅ v0.1 | Employment dates vs. commit activity timeline |
| **Portfolio URL Detection** | ✅ v0.1 | Extracts URLs from CV, finds corresponding GitHub repos |
| **Commit Quality Signals** | ✅ v0.1 | Detects trivial commits, high-frequency activity anomalies |
| **GitHub OAuth** | 📋 v0.2 | 5000 req/hour limit vs. 60 req/hour (needed for private repos) |
| **Local AI Summary** | 📋 v0.3 | Ollama-powered narrative summary (optional) |
| **Backend + Auth** | 📋 v1.0 | SaaS version with bulk analysis, export, and recruiter dashboard |

---

## Security & Privacy

### What data goes where?

| Data | Stays Local? | Details |
|------|---|---------|
| Your CV (PDF) | ✅ **Yes** | Parsed by pdf.js in browser memory; never uploaded |
| GitHub username | ⚠️ **Partial** | Sent to GitHub's public API to fetch *public* profile data only |
| Extracted skills/dates | ✅ **Yes** | Never leaves your device |
| Generated report | ✅ **Yes** | Generated locally; you can export or delete |

### Permissions explained

- `<all_urls>` → **Only** to call `api.github.com` (public endpoints)
- `activeTab` → Detect GitHub usernames on github.com pages
- `declarativeNetRequest` → None currently (reserved for future rate-limit handling)

### What happens if GitHub API is down?

The extension falls back gracefully:
- Shows last cached data (if available)
- Clear error message with suggestion to retry
- No silent failures or partial results

---

## Installation

### Option 1: Load Unpacked (Development)

```bash
cd extension
npm install
npm run build
```

Then in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder

### Option 2: Chrome Web Store (Coming v0.2)

Planned for early Q3 2026 after OAuth support.

---

## Usage

1. **Open any PDF CV** on your computer
2. **Click the extension icon** in your Chrome toolbar
3. **Paste the CV PDF** into the popup (drag-and-drop supported in v0.2)
4. **Enter a GitHub username** (e.g., `torvalds`, `gvanrossum`)
5. **Click Analyze**
6. **Review the flags** — each one links to specific evidence on GitHub
7. **Export or take notes** (Chrome DevTools if needed)

### Example Report Flags

```
🚩 [SKILL GAP] "Expert React" → GitHub shows 0 React repos
   Evidence: Languages bar shows JavaScript 45%, Python 32%, Rust 18%

🚩 [DATE MISMATCH] "Lead role Jan 2020 – Jun 2021" → No commits in that range
   Evidence: First commit on record: Aug 2019 | Last commit: Dec 2018

✅ [VERIFIED] "Open source contributor" → 12 public repos, 340 stars
   Recommendation: Highlight specific projects & impact

⚠️ [MINOR] High frequency commits (2000+ commits in 3 months)
   Flag type: Activity anomaly (could indicate automated bot or CI commits)
```

---

## Architecture

### Core Stack

| Layer | Tech | Why |
|-------|------|-----|
| **Runtime** | Manifest V3 service worker | Modern Chrome standard, better security model |
| **PDF parsing** | `pdfjs-dist` | Battle-tested, works in browsers, offline |
| **GitHub data** | REST API (public endpoints) | No auth needed for public profiles; simpler in v0.1 |
| **Testing** | Vitest + Node.js | Unit tests run in Node; mocked fetch, no browser |
| **Build** | esbuild + TypeScript | Fast, simple, no webpack/Babel overhead |

### File Structure

```
extension/
├── src/
│   ├── types/
│   │   └── index.ts           ← All interfaces (single source of truth)
│   ├── parser/
│   │   ├── pdf-parser.ts      ← Calls pdf.js, returns raw text
│   │   ├── cv-extractor.ts    ← Parses text → skills, dates, urls
│   │   └── tech-list.ts       ← Known tech keywords
│   ├── analyzer/
│   │   ├── github-fetcher.ts  ← Only file that calls fetch()
│   │   └── cross-checker.ts   ← Pure functions: rule logic
│   ├── report/
│   │   └── report-generator.ts ← Builds HTML from flags
│   ├── popup/
│   │   ├── popup.html         ← UI template
│   │   └── popup.ts           ← Event listeners, orchestration
│   ├── background/
│   │   └── background.ts      ← Service worker (thin orchestrator)
│   └── content/
│       └── content.ts         ← Detects github.com, injects username hint
├── tests/
│   ├── fixtures/
│   │   ├── cv-samples/        ← .txt CV mockups
│   │   └── github-mocks/      ← JSON API responses
│   ├── cv-extractor.test.ts
│   ├── cross-checker.test.ts
│   └── github-fetcher.test.ts
├── build.ts                    ← esbuild config
└── package.json
```

### Unidirectional Data Flow

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

---

## Development

### Setup

```bash
cd extension
npm install
npm run build      # One-time build
npm run dev        # Watch mode (rebuilds on file change)
npm run test       # Run unit tests
npm run typecheck  # TS strict mode
npm run lint       # ESLint + formatting check
```

### Testing Philosophy

- **Unit tests only** (no E2E yet)
- **Pure functions tested in Node** (no browser needed)
- **Mocked `fetch`** (never real API calls in tests)
- **Fixtures in `tests/fixtures/`** (real CV samples + GitHub API responses)

### Adding a New Rule

1. Define the `RuleId` in `src/types/index.ts` (e.g., `"SKILL_GAP"`)
2. Write a pure function in `src/analyzer/cross-checker.ts`:
   ```typescript
   function checkSkillGap(cv: CVData, profile: GitHubProfile): Flag | null {
     // return { ruleId: "SKILL_GAP", severity: "high", message: "..." } or null
   }
   ```
3. Add test in `tests/cross-checker.test.ts` with a fixture
4. Call the function in `runCrossCheck()` and push result to `flags[]`

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed examples.

---

## Known Limitations (v0.1)

| Limitation | Impact | Workaround / v Next |
|---|---|---|
| **No GitHub OAuth** | Rate limit 60 req/hr (public API) | v0.2: Add OAuth, unlock 5000 req/hr |
| **Public data only** | Can't see private repos | Expected; by design for v0.1 |
| **No date ranges in API** | Guesses employment dates from commits | v0.2: Let user refine dates manually |
| **No AI narrative** | Report is just flags, not prose | v0.3: Local Ollama (optional) or v1.0 backend (paid) |
| **No bulk analysis** | One CV at a time | v1.0: Recruiter dashboard |
| **No export to PDF** | Can only screenshot or print-to-PDF | v1.0: Programmatic PDF export |

---

## Roadmap

| Phase | Timeline | Description |
|---|---|---|
| **v0.1** | ✅ Current | MVP: Local PDF parse + GitHub fetch + rule-based cross-check |
| **v0.2** | Q3 2026 | GitHub OAuth + commit quality metrics + performance improvements |
| **v0.3** | Q4 2026 | Ollama local AI (optional prose summary) |
| **v1.0** | Q1 2027 | Backend SaaS: Fastify + PostgreSQL + Stripe + Claude API + recruiter auth |
| **v1.1** | Q2 2027 | Recruiter dashboard: bulk analysis, export, team insights |

---

## Troubleshooting

### Extension doesn't show up in toolbar

- Restart Chrome (sometimes needed after loading unpacked)
- Check `chrome://extensions` → verify "CV ↔ GitHub Analyzer" is listed and enabled

### "Cannot read PDF" error

- Ensure PDF is not corrupted (try opening in PDF viewer first)
- v0.2 will add drag-and-drop support and better error messages
- Report the PDF + error in a GitHub issue if it's a valid PDF

### "GitHub API rate limit exceeded"

- You've hit the public API limit (60 requests/hour)
- Solution: Wait 1 hour, or v0.2: use GitHub OAuth for 5000 req/hour
- Check remaining quota: `curl -i https://api.github.com/rate_limit`

### Report shows "Timeout" when fetching GitHub

- GitHub API might be slow or temporarily down
- Extension retries once automatically
- If it persists, check [GitHub Status](https://www.githubstatus.com/)

---

## Contributing

We welcome bug reports, feature requests, and pull requests.

- **Bug reports** → [GitHub Issues](https://github.com/Isaacxiddd/cv_github_analyzer/issues)
- **Code contributions** → See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Discussions** → [GitHub Discussions](https://github.com/Isaacxiddd/cv_github_analyzer/discussions)

---

## Contact

- **Author:** Isaac Garcia
- **Email:** isaacjosegarciamarquez@gmail.com
- **GitHub:** [@Isaacxiddd](https://github.com/Isaacxiddd)

---

## License

[Apache License 2.0](LICENSE) © 2025 Isaac Garcia

---

## FAQ

**Q: Does the extension collect any data about me?**  
A: No. All processing is local. We never store, log, or transmit your CV or GitHub profile to any server.

**Q: Can I use this for recruiting teams?**  
A: v0.1 is single-user. For team/bulk analysis, v1.0 (backend SaaS) is planned for Q1 2027.

**Q: Why no GitHub OAuth in v0.1?**  
A: Simpler to ship, fewer dependencies, works for 80% of public profiles. OAuth arrives in v0.2.

**Q: Can I analyze private repos?**  
A: Not in v0.1 (by design). Private profile data requires OAuth + your explicit permission (v0.2).

**Q: What if my GitHub username has special characters?**  
A: GitHub usernames only allow letters, digits, and hyphens. The extension validates input before API calls.
