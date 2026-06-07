// Service worker — orchestrates analysis when called from popup via messaging.
// Kept intentionally thin: all business logic lives in parser/ and analyzer/.

import { extractCV } from '../parser/cv-extractor.js';
import { fetchGitHubProfile } from '../analyzer/github-fetcher.js';
import { runCrossCheck } from '../analyzer/cross-checker.js';
import type { BackgroundMessage, BackgroundResponse } from '../types/index.js';

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, _sender, sendResponse: (r: BackgroundResponse) => void) => {
    if (message.type !== 'ANALYZE') return false;

    handleAnalyze(message.cvText, message.githubUsername)
      .then(result => sendResponse({ type: 'ANALYZE_RESULT', result }))
      .catch(err => sendResponse({ type: 'ANALYZE_ERROR', message: String(err?.message ?? err) }));

    return true; // keep channel open for async response
  }
);

async function handleAnalyze(cvText: string, githubUsername: string) {
  const cv = extractCV(cvText);
  const profile = await fetchGitHubProfile(githubUsername);
  return runCrossCheck(cv, profile);
}
