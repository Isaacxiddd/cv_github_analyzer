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

export function ruleYearsMismatch(skill: string, profile: GitHubProfile, cv: ExtractedCV): Flag | null {
  if (isImplied(skill, profile, cv)) return null;
  const claimed = cv.dates.find(d => d.skill && d.skill.toLowerCase().includes(skill.toLowerCase()));
  if (!claimed || claimed.yearsOfExperience < 1) return null;

  const lang = githubLangFor(skill);
  if (!lang) return null;
  const langRepos = profile.repos.filter(r => r.primaryLanguage.toLowerCase() === lang.toLowerCase());
  if (langRepos.length === 0) return null;

  const oldest = langRepos.reduce((min, r) => {
    if (!r.firstCommitDate) return min;
    return !min || r.firstCommitDate < min ? r.firstCommitDate : min;
  }, null as Date | null);

  if (!oldest) return null;
  const githubYears = (Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const diff = claimed.yearsOfExperience - githubYears;

  if (diff > 1.5) {
    return {
      type: 'RED',
      skill,
      ruleId: 'YEARS_MISMATCH',
      message: `Claimed ${claimed.yearsOfExperience}y of ${skill} but GitHub shows ~${githubYears.toFixed(1)}y`,
      evidence: `Oldest ${lang} repo: ${oldest.toISOString().slice(0, 7)}`,
    };
  }
  return null;
}
