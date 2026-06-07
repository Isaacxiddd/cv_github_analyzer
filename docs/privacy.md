# Privacy

## Data Flow

### What data goes where?

| Data | Stays Local? | Details |
|------|---|---------|
| Your CV (PDF) | ✅ **Yes** | Parsed by pdf.js in browser memory; never uploaded |
| GitHub username | ⚠️ **Partial** | Sent to GitHub's public API to fetch *public* profile data only |
| Extracted skills/dates | ✅ **Yes** | Never leaves your device |
| Generated report | ✅ **Yes** | Generated locally; you can export or delete |
| GitHub token (optional) | ✅ **Yes** | Stored in `chrome.storage.sync` (encrypted by Chrome) |

### Permissions explained

- `<all_urls>` → **Only** to call `api.github.com` (public endpoints)
- `activeTab` → Detect GitHub usernames on github.com pages
- `storage` → Save analysis history and optional token locally

### What happens if GitHub API is down?

The extension falls back gracefully:
- Shows last cached data (if available)
- Clear error message with suggestion to retry
- No silent failures or partial results

## v0.1 Design Principles

1. **No backend** — all processing in your browser
2. **No analytics** — no tracking, no telemetry, no cookies
3. **No data storage** — reports generated on-the-fly, history stored locally
4. **Open source** — full code transparency, anyone can audit
