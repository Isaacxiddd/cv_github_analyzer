import type { Flag, GitHubProfile } from '../../types/index.js';

export function ruleNoReadme(profile: GitHubProfile): Flag | null {
  if (profile.repos.length === 0) return null;
  const noReadme = profile.repos.filter(r => !r.hasReadme).length;
  const ratio = noReadme / profile.repos.length;
  if (ratio > 0.5) {
    return {
      type: 'YELLOW',
      skill: 'Documentation',
      ruleId: 'NO_README',
      message: `${Math.round(ratio * 100)}% of repos have no README`,
      evidence: `${noReadme} of ${profile.repos.length} repos lack documentation`,
    };
  }
  return null;
}
