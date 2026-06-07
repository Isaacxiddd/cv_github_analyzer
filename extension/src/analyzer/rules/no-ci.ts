import type { Flag, GitHubProfile } from '../../types/index.js';
import { isRelevantRepo } from '../repo-utils.js';

export function ruleNoCI(profile: GitHubProfile): Flag | null {
  const relevant = profile.repos.filter(isRelevantRepo);
  if (relevant.length < 2) return null;
  const noCI = relevant.filter(r => !r.hasCI).length;
  const ratio = noCI / relevant.length;
  if (ratio > 0.9) {
    return {
      type: 'GRAY',
      skill: 'CI/CD',
      ruleId: 'NO_CI',
      message: `No CI/CD evidence in ${noCI} of ${relevant.length} active repos`,
      evidence: `${Math.round(ratio * 100)}% of recently active repos lack GitHub Actions or CI config`,
    };
  }
  return null;
}
