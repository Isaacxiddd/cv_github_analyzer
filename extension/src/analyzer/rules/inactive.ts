import type { Flag, GitHubProfile } from '../../types/index.js';

export function ruleInactive(profile: GitHubProfile): Flag | null {
  const recentRepos = profile.repos.filter(r => {
    if (!r.lastCommitDate) return false;
    const daysAgo = (Date.now() - r.lastCommitDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 180;
  });
  const latest = profile.repos[0]?.lastCommitDate?.toISOString().slice(0, 10);
  if (recentRepos.length === 0 && profile.repos.length > 0 && latest) {
    return {
      type: 'YELLOW',
      skill: 'General Activity',
      ruleId: 'INACTIVE',
      message: `No public commits detected in the last 6 months — last push was ${latest}`,
      evidence: `0 active repos with commits in the analyzed period (180 days)`,
    };
  }
  return null;
}
