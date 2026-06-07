# Architecture Decisions

## 1. GitHub Username Extraction from React SPAs

### Problem
Many developers host portfolios as React single-page applications. GitHub URLs are often buried in JS event handlers (`onClick`, `onMouseDown`) that are invisible to standard DOM scanning.

### Attempt 1: DOM scanning
- Scan all `<a>` tags for `github.com` links
- **Problem:** React SPAs render GitHub URLs in JS event handlers, not in `href` attributes

### Attempt 2: Bundle analysis
- Fetch all `<script src="...">` bundles and search for `github.com` patterns via `matchAll`
- **Problem:** Slow (sequential fetches), timeout-prone on large bundles

### Attempt 3 (Chosen): React props introspection
- Read React's internal `__reactProps$<hash>` DOM properties
- Extract `onClick`, `onMouseDown`, `onKeyDown` handler source code via `toString()`
- Also checks `href`, `aria-label`, `children`, and `textContent`
- **Result:** Fast (synchronous), no network requests, works offline

### Outcome
A hybrid approach: bundle analysis (async, background) + React props introspection (sync, fallback). The React props technique is unique enough that it was documented in a [design journey doc](DESIGN_JOURNEY.md).

---

## 2. Pure Functions First

### Decision
All extraction, analysis, and report generation are pure functions with zero side effects.

### Rationale
- Testable in Node.js without browser mocks
- No need for Jest/Vitest DOM environments
- Functions can be parallelized, cached, or tree-shaken
- Explicit dependency injection makes `github-fetcher` the only I/O boundary

### Trade-off
Some CV extraction patterns (e.g. date parsing) are more verbose in pure functions than in a regex-heavy DSL. We accept this for testability.

---

## 3. Single Types File

### Decision
All interfaces live in `src/types/index.ts`. No local type definitions in modules.

### Rationale
- Single source of truth prevents drift
- Easy to audit the full data model
- Simpler imports: always from `../types/index.js`
- Type changes are immediately visible across the codebase

---

## 4. GitHub Fetcher as Only I/O Layer

### Decision
`github-fetcher.ts` is the only module that calls `fetch()`. All other modules receive data as parameters.

### Rationale
- Testability: mock one file, test everything
- Security: audit surface for data exfiltration is one file
- Reliability: centralize retry logic, rate limiting, error handling

---

## 5. Scoring Algorithm

### Decision
Scores are computed from flags (not from raw data):

```
coherence = 100 - (RED_flags × 20 + YELLOW_flags × 8)
github    = 40 + commitActivity + testRepos + ciRepos
cv        = 100 - (skillFlags / totalSkills) × 50
global    = coherence × 0.5 + github × 0.3 + cv × 0.2
```

### Rationale
- Transparent: users can see exactly which flags affect their score
- Stable: scores change only when flags change
- Weighted: coherence (CV × GitHub alignment) is weighted highest

---

## 6. Plugin-like Rule Architecture (v0.1 → v0.2)

### Current (v0.1)
Rules are functions in `cross-checker.ts`, iterated over skills:
```
runCrossCheck(cv, profile) → Flag[]
```

### Planned (v0.2)
Each rule is a separate module with a standard interface:
```typescript
interface CrossCheckRule {
  id: RuleId;
  severity: FlagType;
  appliesTo: 'skill' | 'profile' | 'both';
  run(skill: string, cv: ExtractedCV, profile: GitHubProfile): Flag | null;
}
```

This enables:
- Rules to be added/removed via config
- Community-contributed rules
- Rule testing in isolation

---

## 7. No Backend (v0.1)

### Decision
v0.1 is 100% client-side. No data leaves the browser except GitHub API calls.

### Rationale
- Zero infrastructure costs
- Maximum privacy (no data upload)
- Simple distribution (Chrome extension, no server)
- Fast iteration (no deployment pipeline)

### Trade-off
Limited to public GitHub data. Private repos and advanced features require OAuth (v0.2).
