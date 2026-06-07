import type { Flag, ExtractedCV, GitHubProfile } from '../../types/index.js';
import { githubLangFor, isImplied } from '../language-utils.js';

export function ruleRecentOnly(skill: string, profile: GitHubProfile, cv: ExtractedCV): Flag | null {
  const lang = githubLangFor(skill);
  if (!lang) return null;
  if (isImplied(skill, profile, cv)) return null;
  const langRepos = profile.repos.filter(r => r.primaryLanguage.toLowerCase() === lang.toLowerCase());
  if (langRepos.length === 0) return null;

  const oldest = langRepos.reduce((min, r) => {
    if (!r.firstCommitDate) return min;
    return !min || r.firstCommitDate < min ? r.firstCommitDate : min;
  }, null as Date | null);

  if (!oldest) return null;
  const monthsOld = (Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsOld < 12) {
    return {
      type: 'YELLOW',
      skill,
      ruleId: 'RECENT_ONLY',
      message: `Public ${skill} evidence detected only in the last 12 months`,
      evidence: `Oldest public ${lang} repo was created ${Math.round(monthsOld)} months ago`,
    };
  }
  return null;
}
