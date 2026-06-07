import type { Flag, GitHubProfile } from '../../types/index.js';
import { isRelevantRepo } from '../repo-utils.js';

export function ruleNoTests(profile: GitHubProfile): Flag | null {
  const relevant = profile.repos.filter(isRelevantRepo);
  if (relevant.length < 2) return null;
  const noTests = relevant.filter(r => !r.hasTests).length;
  const ratio = noTests / relevant.length;
  if (ratio > 0.7) {
    return {
      type: 'YELLOW',
      skill: 'Testing',
      ruleId: 'NO_TESTS',
      message: `No public testing evidence detected in ${noTests} of ${relevant.length} analyzed repositories`,
      evidence: `${relevant.length} recently active repos reviewed; ${noTests} had no test files or directories`,
    };
  }
  return null;
}
