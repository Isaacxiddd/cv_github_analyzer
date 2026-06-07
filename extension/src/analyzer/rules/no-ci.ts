import type { Flag, GitHubProfile } from '../../types/index.js';

export function ruleNoCI(profile: GitHubProfile): Flag | null {
  if (profile.repos.length === 0) return null;
  const noCI = profile.repos.filter(r => !r.hasCI).length;
  const ratio = noCI / profile.repos.length;
  if (ratio > 0.9) {
    return {
      type: 'GRAY',
      skill: 'CI/CD',
      ruleId: 'NO_CI',
      message: 'No CI/CD configuration detected in repos',
      evidence: `${noCI} of ${profile.repos.length} repos without GitHub Actions`,
    };
  }
  return null;
}
