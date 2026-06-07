import type { Repository } from '../types/index.js';

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

export function isRelevantRepo(repo: Repository): boolean {
  if (repo.sizeKb === 0) return false;
  if (!repo.lastCommitDate) return false;
  const age = Date.now() - repo.lastCommitDate.getTime();
  if (age > SIX_MONTHS_MS) return false;
  return true;
}
