import type { Flag, ExtractedCV, GitHubProfile } from '../../types/index.js';
import { TECH_LIST } from '../../data/technologies.js';

function githubLangFor(skill: string): string | undefined {
  return TECH_LIST.find(t => t.canonical === skill)?.githubLanguage;
}

function isImplied(skill: string, profile: GitHubProfile, cv: ExtractedCV): boolean {
  const hasLangInGitHub = (lang: string) =>
    Object.keys(profile.languageStats).some(l => l.toLowerCase() === lang.toLowerCase());

  if (skill === 'JavaScript') {
    return hasLangInGitHub('TypeScript');
  }
  if (skill === 'HTML' || skill === 'CSS') {
    return hasLangInGitHub('TypeScript') || hasLangInGitHub('JavaScript');
  }
  return false;
}

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
      message: `${skill} activity is recent (< 1 year)`,
      evidence: `Oldest ${lang} repo created ${Math.round(monthsOld)} months ago`,
    };
  }
  return null;
}
