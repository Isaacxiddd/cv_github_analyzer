# Cross-Check Rules

Each rule is a pure function that returns either a `Flag` or `null`.

## Flag labels

| Type | Label | Meaning |
|------|-------|---------|
| `RED` | 🔴 Discrepancy | Claim vs evidence mismatch found |
| `YELLOW` | 🟡 Observation | Notable pattern detected |
| `GREEN` | 🟢 Verified | Evidence confirms the claim |
| `GRAY` | ⚪ Not observed | No evidence found (neutral) |

## Principles

1. **Evidence-based language** — flags report what was *observed*, not what was *concluded*
2. **Relevant repos only** — quality rules (tests, README, CI) only consider repos with size > 0 KB, a README, and recent activity
3. **No false precision** — all messages are careful to distinguish "no evidence found" from "evidence of absence"

## Rule Catalog

### NO_REPOS — Skill claimed in CV but no public GitHub repos found

| Field | Value |
|-------|-------|
| **Severity** | 🔴 High |
| **Type** | `RED` |
| **Trigger** | A language skill (e.g. "Python") listed in CV has zero matching repos on GitHub |
| **Implied skills** | TypeScript → JavaScript, TS/JS → HTML/CSS |
| **Message** | *"No public {skill} repos found"* |
| **Why it matters** | Public repo evidence is the most objective signal available |

### YEARS_MISMATCH — Claimed experience vs public history

| Field | Value |
|-------|-------|
| **Severity** | 🔴 High |
| **Type** | `RED` |
| **Trigger** | CV claims N years of skill X but oldest public GitHub repo in X shows < N-1.5 years |
| **Threshold** | Flagged when `CV_years - GitHub_years > 1.5` |
| **Message** | *"Claimed {N}y of {skill} but public GitHub activity shows ~{N}y"* |
| **Caveat** | Public GitHub history may not reflect private/professional experience |

### RECENT_ONLY — Public skill evidence is recent

| Field | Value |
|-------|-------|
| **Severity** | ⚪ Info |
| **Type** | `GRAY` |
| **Trigger** | All public repos using skill X are less than 12 months old |
| **Message** | *"Public {skill} evidence detected only in the last 12 months"* |
| **Note** | Indicates recency, not evidence volume — many repos can trigger this |

### INACTIVE — No recent public activity

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Type** | `YELLOW` |
| **Trigger** | Zero repos with commits in the last 180 days |
| **Message** | *"No recent public activity — last push was {date}"* |
| **Why it matters** | No judgment made about private activity; only public commit data is available |

### NO_TESTS — No public testing evidence found

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Type** | `YELLOW` |
| **Trigger** | >70% of relevant* repos have no test files or directories |
| **Message** | *"No public testing evidence in {N} of {M} active repos"* |
| **Detection** | Checks for `test/`, `tests/`, `spec/`, `__tests__/`, `e2e/` directories AND `*.test.*`, `*.spec.*` files |
| **\*Relevant** | Repos with size > 0 KB and activity in the last 6 months |
| **Caveat** | Tests may exist in private repos, separate test suites, or non-obvious structures |

### NO_README — Public documentation gap

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Type** | `YELLOW` |
| **Trigger** | >50% of relevant* repos lack a README file |
| **Message** | *"{N} of {M} active repos lack documentation"* |
| **\*Relevant** | Repos with size > 0 KB and activity in the last 6 months |

### NO_CI — No public CI/CD evidence

| Field | Value |
|-------|-------|
| **Severity** | ⚪ Low |
| **Type** | `GRAY` |
| **Trigger** | >90% of relevant* repos have no GitHub Actions or CI config |
| **Message** | *"No CI/CD evidence in {N} of {M} active repos"* |
| **\*Relevant** | Repos with size > 0 KB and activity in the last 6 months |
| **Caveat** | CI may be configured externally (Jenkins, GitLab CI, etc.) |

### EMPTY_REPOS — Repos exist but are empty stubs

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Type** | `YELLOW` |
| **Trigger** | All repos matching a skill have 0 KB size (no file content) |
| **Message** | *"{skill} repos exist but appear to be empty stubs"* |
| **Why it matters** | An empty repo only shows the language was selected, not that it was used |

### VERIFIED — Skill confirmed

| Field | Value |
|-------|-------|
| **Severity** | 🟢 Info |
| **Type** | `GREEN` |
| **Trigger** | A skill listed in CV has matching GitHub repos with no RED flags |
| **Evidence** | Lists specific repo names that matched |
