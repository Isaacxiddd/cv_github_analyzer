import { extractCV } from '../parser/cv-extractor.js';
import { fetchGitHubProfile } from '../analyzer/github-fetcher.js';
import { runCrossCheck } from '../analyzer/cross-checker.js';
import type { BackgroundMessage, BackgroundResponse } from '../types/index.js';

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, sender, sendResponse: (r: BackgroundResponse) => void) => {
    if (message.type === 'WIDGET_SHOW') {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
        }
      });
      return false;
    }
    if (message.type === 'WIDGET_HIDE') {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
        }
      });
      return false;
    }
    if (message.type !== 'ANALYZE') return false;

    handleAnalyze(message.cvText, message.githubUsername, message.token)
      .then(result => sendResponse({ type: 'ANALYZE_RESULT', result }))
      .catch(err => sendResponse({ type: 'ANALYZE_ERROR', message: String(err?.message ?? err) }));

    return true;
  }
);

async function handleAnalyze(cvText: string, githubUsername: string, token?: string) {
  const cv = extractCV(cvText);
  const profile = await fetchGitHubProfile(githubUsername, token);
  return runCrossCheck(cv, profile);
}
