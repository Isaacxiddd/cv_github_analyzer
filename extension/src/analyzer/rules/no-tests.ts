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
      message: `No public testing evidence in ${noTests} of ${relevant.length} active repos`,
      evidence: `Reviewed ${relevant.length} repos with recent activity and documentation; ${noTests} lack test files or directories`,
    };
  }
  return null;
}
