import { parsePDF, validatePDF } from '../parser/pdf-parser.js';
import { extractCV } from '../parser/cv-extractor.js';
import { fetchGitHubProfile, GitHubNotFoundError, GitHubRateLimitError } from '../analyzer/github-fetcher.js';
import { runCrossCheck } from '../analyzer/cross-checker.js';
import { generateReport } from '../report/report-generator.js';

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const fileNameEl = document.getElementById('file-name') as HTMLDivElement;
const usernameInput = document.getElementById('username-input') as HTMLInputElement;
const analyzeBtn = document.getElementById('analyze-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const resultsEl = document.getElementById('results') as HTMLDivElement;

let selectedFile: File | null = null;

// ─── File handling ────────────────────────────────────────────────────────────

function setFile(file: File): void {
  const validation = validatePDF(file);
  if (!validation.valid) {
    setStatus(validation.error ?? 'Invalid file', true);
    return;
  }
  selectedFile = file;
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

// ─── Analysis ─────────────────────────────────────────────────────────────────

analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  const username = usernameInput.value.trim().replace(/^@/, '');
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
    const profile = await fetchGitHubProfile(username);

    setStatus('Cross-checking…');
    const result = runCrossCheck(cv, profile);

    resultsEl.innerHTML = generateReport(result);
    setStatus(`Done — ${result.flags.length} finding(s)`);
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
