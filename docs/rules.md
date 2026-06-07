# Cross-Check Rules

Each rule is a pure function that receives `(cv, profile)` and returns either a `Flag` or `null`.

## Rule Catalog

### NO_REPOS — Skill present in CV but absent from GitHub

| Field | Value |
|-------|-------|
| **Severity** | 🔴 High |
| **Type** | `RED` |
| **Trigger** | A language skill (e.g. "Python") listed in CV has zero matching repos on GitHub |
| **Implied skills** | TypeScript → JavaScript, TS/JS → HTML/CSS |
| **Why it matters** | Most common CV inflation pattern |

### YEARS_MISMATCH — Claimed experience years vs GitHub evidence

| Field | Value |
|-------|-------|
| **Severity** | 🔴 High |
| **Type** | `RED` |
| **Trigger** | CV claims N years of skill X but oldest GitHub repo in X shows < N-1.5 years |
| **Threshold** | Flagged when `CV_years - GitHub_years > 1.5` |
| **Example** | "5 years React" → first React commit was 2 years ago → flagged |

### RECENT_ONLY — Skill activity is recent

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Type** | `YELLOW` |
| **Trigger** | All repos using skill X are less than 12 months old |
| **Why it matters** | May indicate recent learning, not deep experience |

### INACTIVE — No recent commit activity

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Type** | `YELLOW` |
| **Trigger** | Zero repos with commits in the last 180 days |
| **Why it matters** | GitHub should be active if CV claims current development work |

### NO_TESTS — Lack of testing culture

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Type** | `YELLOW` |
| **Trigger** | >70% of repos have no `test/`, `tests/`, `spec/`, or `e2e/` directory |
| **Why it matters** | Testing is a quality signal for professional developers |

### NO_README — Poor documentation

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Type** | `YELLOW` |
| **Trigger** | >50% of repos lack a README file |
| **Why it matters** | README indicates project maturity and communication skills |

### NO_CI — No CI/CD configuration

| Field | Value |
|-------|-------|
| **Severity** | ⚪ Low |
| **Type** | `GRAY` |
| **Trigger** | >90% of repos have no GitHub Actions or CI config |
| **Why it matters** | CI/CD is a professional engineering standard |

### EMPTY_REPOS — Repo exists but has no commits

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Type** | `YELLOW` |
| **Trigger** | All repos matching a skill have zero commits (stub/empty repos) |
| **Why it matters** | An empty repo proves nothing about proficiency — it only shows the language was selected |

### VERIFIED — Skill confirmed

| Field | Value |
|-------|-------|
| **Severity** | 🟢 Info |
| **Type** | `GREEN` |
| **Trigger** | A skill listed in CV has matching GitHub repos with no RED flags |
| **Meaning** | Skill is consistent between CV and GitHub |
