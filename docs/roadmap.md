# Roadmap

## v0.1 — Local MVP (Current) ✅

**Focus:** Individual developers validating their own CV ↔ GitHub consistency.

### Features
- PDF CV parsing with pdf.js (client-side only)
- GitHub public profile fetching (REST API, no auth)
- Cross-check: skill gap detection, date alignment, repo quality signals
- Color-coded report with score gauges (CV, GitHub, Coherence, Global)
- Analysis history with restore capability
- Portfolio URL scraping with auto-fill GitHub username
- 38 unit tests, TypeScript strict mode

### Limitations
- 60 req/hr GitHub rate limit (no OAuth)
- Public data only
- Single-user, one CV at a time
- Scoring is heuristic-based and may not reflect real-world skill level
- CV score only penalises missing repos, mismatched years, empty repos, and code quality flags (README/tests/CI)

### Scoring improvements for future versions
- Weight by repo quality (stars, forks, contributors)
- Penalise stale repos (no commits in 6+ months) more aggressively
- Add commit-content analysis (trivial vs. meaningful commits)
- Factor in repo diversity (monorepo vs. dedicated repos per skill)
- Assign higher confidence to repos with multiple collaborators
- Per-language depth: small commits in 10 repos vs. deep work in 1 repo

---

## v0.2 — OAuth & Quality Metrics 🔜

**Focus:** Deeper analysis with authenticated GitHub access.

- GitHub OAuth via `chrome.identity.getAuthToken`
- 5000 req/hr rate limit
- Private repo analysis (with user permission)
- Commit quality metrics: trivial commit detection, PR merge patterns
- Drag-and-drop CV upload
- Manual date range refinement

---

## v0.3 — Local AI Summary

**Focus:** Optional AI-powered narrative.

- Ollama integration (local, optional)
- Natural language summary of inconsistencies
- Skill development recommendations
- **Explicitly optional** — everything works without AI

---

## v1.0 — Backend SaaS

**Focus:** Multi-user, team/enterprise use.

- Fastify + PostgreSQL + Redis/BullMQ backend
- Claude API for AI analysis
- User accounts and team management
- Bulk CV analysis for recruiters
- PDF/CSV export
- Stripe subscription

---

## v1.1 — Recruiter Dashboard

**Focus:** Dedicated recruiter experience.

- Next.js 15 dashboard
- Team workspace with shared reports
- Advanced filtering and search
- API for external integrations
