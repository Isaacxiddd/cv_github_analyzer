import type { Flag, GitHubProfile } from '../../types/index.js';

export function ruleNoTests(profile: GitHubProfile): Flag | null {
  if (profile.repos.length === 0) return null;
  const noTests = profile.repos.filter(r => !r.hasTests).length;
  const ratio = noTests / profile.repos.length;
  if (ratio > 0.7) {
    return {
      type: 'YELLOW',
      skill: 'Testing',
      ruleId: 'NO_TESTS',
      message: `${Math.round(ratio * 100)}% of repos have no test directory`,
      evidence: `${noTests} of ${profile.repos.length} repos without /test or /spec`,
    };
  }
  return null;
}
