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

export function ruleNoRepos(skill: string, profile: GitHubProfile, cv: ExtractedCV): Flag | null {
  const lang = githubLangFor(skill);
  if (!lang) return null;
  const hasLang = Object.keys(profile.languageStats).some(
    l => l.toLowerCase() === lang.toLowerCase()
  );
  if (!hasLang && !isImplied(skill, profile, cv)) {
    return {
      type: 'RED',
      skill,
      ruleId: 'NO_REPOS',
      message: `No repos found using ${skill}`,
      evidence: `0 repos with ${lang} in GitHub language stats`,
    };
  }
  return null;
}
