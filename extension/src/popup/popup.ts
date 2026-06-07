import { parsePDF, validatePDF } from '../parser/pdf-parser.js';
import { extractCV } from '../parser/cv-extractor.js';
import { fetchGitHubProfile, GitHubNotFoundError, GitHubRateLimitError } from '../analyzer/github-fetcher.js';
import { runCrossCheck } from '../analyzer/cross-checker.js';
import { generateReport } from '../report/report-generator.js';
import { getStoredToken, setToken, removeToken } from '../auth/token-storage.js';
import { getHistory, saveEntry, clearHistory } from '../background/history.js';
import type { HistoryEntry } from '../types/index.js';

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const fileNameEl = document.getElementById('file-name') as HTMLDivElement;
const usernameInput = document.getElementById('username-input') as HTMLInputElement;
const analyzeBtn = document.getElementById('analyze-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const resultsEl = document.getElementById('results') as HTMLDivElement;
const tokenToggle = document.getElementById('token-toggle') as HTMLDivElement;
const tokenBody = document.getElementById('token-body') as HTMLDivElement;
const tokenInput = document.getElementById('token-input') as HTMLInputElement;
const tokenStatus = document.getElementById('token-status') as HTMLSpanElement;
const tokenArrow = document.getElementById('token-arrow') as HTMLSpanElement;
const tokenToggleVis = document.getElementById('token-toggle-vis') as HTMLButtonElement;
const tokenClear = document.getElementById('token-clear') as HTMLButtonElement;
const minimizeBtn = document.getElementById('minimize-btn') as HTMLButtonElement;
const historyList = document.getElementById('history-list') as HTMLDivElement;
const clearHistoryBtn = document.getElementById('clear-history') as HTMLButtonElement;

let selectedFile: File | null = null;
let tokenOpen = false;
let currentFilename = '';
let isRestoring = false;

// ─── Token UI ─────────────────────────────────────────────────────────────────

function setTokenUI(token: string | undefined): void {
  if (token) {
    tokenStatus.textContent = '✓ Configured';
    tokenStatus.className = 'status ok';
    tokenInput.value = token;
  } else {
    tokenStatus.textContent = 'Not set';
    tokenStatus.className = 'status';
    tokenInput.value = '';
  }
}

tokenToggle.addEventListener('click', () => {
  tokenOpen = !tokenOpen;
  tokenBody.classList.toggle('open', tokenOpen);
  tokenArrow.classList.toggle('open', tokenOpen);
});

tokenToggleVis.addEventListener('click', () => {
  tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
});

tokenInput.addEventListener('input', () => {
  const val = tokenInput.value.trim();
  if (val) {
    setToken(val);
    setTokenUI(val);
  } else {
    removeToken();
    setTokenUI(undefined);
  }
});

tokenClear.addEventListener('click', async () => {
  await removeToken();
  setTokenUI(undefined);
  setStatus('Token removed', false);
});

async function initToken(): Promise<void> {
  const token = await getStoredToken();
  setTokenUI(token);
}

// ─── Minimize ─────────────────────────────────────────────────────────────────

minimizeBtn.addEventListener('click', () => {
  window.close();
});

// ─── File handling ────────────────────────────────────────────────────────────

function setFile(file: File): void {
  const validation = validatePDF(file);
  if (!validation.valid) {
    setStatus(validation.error ?? 'Invalid file', true);
    return;
  }
  selectedFile = file;
  currentFilename = file.name;
  fileNameEl.textContent = file.name;
  dropZone.classList.add('has-file');
  dropZone.classList.remove('over');
  updateButton();
}

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files?.[0]) setFile(fileInput.files[0]);
});
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  if (e.dataTransfer?.files[0]) setFile(e.dataTransfer.files[0]);
});

// ─── Button state ─────────────────────────────────────────────────────────────

function updateButton(): void {
  analyzeBtn.disabled = !selectedFile || !usernameInput.value.trim();
}
usernameInput.addEventListener('input', updateButton);

// ─── Status helpers ───────────────────────────────────────────────────────────

function setStatus(msg: string, isError = false): void {
  statusEl.textContent = msg;
  statusEl.className = isError ? 'error' : '';
}

function setLoading(loading: boolean): void {
  analyzeBtn.disabled = loading;
  analyzeBtn.textContent = loading ? 'Analyzing…' : 'Analyze';
}

// ─── History ──────────────────────────────────────────────────────────────────

async function loadHistory(): Promise<void> {
  const history = await getHistory();
  renderHistory(history);
}

function renderHistory(history: HistoryEntry[]): void {
  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No analyses yet</div>';
    return;
  }
  historyList.innerHTML = history.map(entry => {
    const date = new Date(entry.analyzed_at).toLocaleString();
    return `
      <div class="history-item" data-id="${entry.id}">
        <span class="h-user">@${entry.github_username}</span>
        <span class="h-score">${entry.score_coherence}%</span>
        <span class="h-date">${date}</span>
      </div>`;
  }).join('');

  historyList.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.id;
      if (!id) return;
      const entry = history.find(e => e.id === id);
      if (entry) restoreFromHistory(entry);
    });
  });
}

function restoreFromHistory(entry: HistoryEntry): void {
  isRestoring = true;
  resultsEl.innerHTML = generateReport(entry.result);
  usernameInput.value = entry.github_username;
  currentFilename = entry.cv_filename;
  if (currentFilename) {
    fileNameEl.textContent = currentFilename;
    dropZone.classList.add('has-file');
  }
  setStatus(`Restored analysis from ${new Date(entry.analyzed_at).toLocaleString()}`);
  isRestoring = false;
}

clearHistoryBtn.addEventListener('click', async () => {
  await clearHistory();
  renderHistory([]);
  setStatus('History cleared');
});

// ─── Analysis ─────────────────────────────────────────────────────────────────

analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  const username = usernameInput.value.trim().replace(/^@/, '');
  const token = await getStoredToken();
  setLoading(true);
  setStatus('Parsing PDF…');
  resultsEl.innerHTML = '';

  try {
    const rawText = await parsePDF(selectedFile);
    setStatus('Extracting skills…');
    const cv = extractCV(rawText);

    if (cv.skills.length === 0) {
      setStatus('No recognizable skills found in the PDF. Check the file.', true);
      return;
    }

    setStatus(`Found ${cv.skills.length} skills. Fetching GitHub…`);
    const profile = await fetchGitHubProfile(username, token);

    setStatus('Cross-checking…');
    const result = runCrossCheck(cv, profile);

    resultsEl.innerHTML = generateReport(result);

    const entry: HistoryEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      github_username: profile.username,
      cv_filename: currentFilename,
      score_github: result.scores.github,
      score_cv: result.scores.cv,
      score_coherence: result.scores.coherence,
      score_global: result.scores.global,
      flags: result.flags.map(f => ({
        level: f.type.toLowerCase() as HistoryEntry['flags'][number]['level'],
        skill: f.skill,
        reason: f.message,
      })),
      analyzed_at: new Date().toISOString(),
      result,
    };
    await saveEntry(entry);
    await loadHistory();

    const reds = result.flags.filter(f => f.type === 'RED').length;
    const yellows = result.flags.filter(f => f.type === 'YELLOW').length;
    setStatus(`Done — ${reds} high, ${yellows} low, ${result.flags.length} total finding(s)`);
  } catch (err) {
    if (err instanceof GitHubNotFoundError) {
      setStatus(`GitHub user "@${username}" not found.`, true);
    } else if (err instanceof GitHubRateLimitError) {
      setStatus('GitHub rate limit hit. Wait a minute and retry.', true);
    } else {
      setStatus((err as Error).message ?? 'Unknown error', true);
    }
  } finally {
    setLoading(false);
    updateButton();
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

initToken();
loadHistory();
