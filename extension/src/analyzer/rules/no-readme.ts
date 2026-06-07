import type { Flag, GitHubProfile } from '../../types/index.js';
import { isRelevantRepo } from '../repo-utils.js';

export function ruleNoReadme(profile: GitHubProfile): Flag | null {
  const relevant = profile.repos.filter(isRelevantRepo);
  if (relevant.length < 2) return null;
  const noReadme = relevant.filter(r => !r.hasReadme).length;
  const ratio = noReadme / relevant.length;
  if (ratio > 0.5) {
    return {
      type: 'YELLOW',
      skill: 'Documentation',
      ruleId: 'NO_README',
      message: `${noReadme} of ${relevant.length} active repos lack documentation`,
      evidence: `${Math.round(ratio * 100)}% of recently active repos have no README file`,
    };
  }
  return null;
}
