# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in CV ↔ GitHub Analyzer, please **do not** open a public issue.

Instead, send a private report to the project maintainers via [GitHub Security Advisories](https://github.com/Isaacxiddd/cv_github_analyzer/security/advisories/new) or email [isaacjosegarciamarquez@gmail.com].

Please include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (if known)

### Response Timeline

- **24-48 hours** — Initial acknowledgment
- **7 days** — Status update and fix timeline
- **30 days** — Target resolution window for critical issues

## Scope

The following are **in scope** for security reporting:

- The Chrome Extension (`extension/` directory)
- The Backend API (`backend/` directory)
- The Dashboard (`dashboard/` directory)
- Build and deployment pipelines

## Out of Scope

- Theoretical attacks without practical exploit
- Social engineering of project maintainers
- Automated tool scanner reports without proof of exploit

## Data Handling

- CV content is processed **locally** in the browser (v0.1)
- GitHub API calls use public data only (no auth tokens required in v0.1)
- No analytics, tracking, or telemetry is included
- No user data is sent to any third-party server

## Safe Harbor

We will not pursue legal action against researchers who report vulnerabilities in good faith, as long as they:

1. Follow this disclosure policy
2. Do not access or modify user data without permission
3. Do not exploit the vulnerability beyond what is necessary to demonstrate it
4. Provide reasonable time for a fix before public disclosure
