import type { ExtractedCV, GitHubProfile } from '../types/index.js';
import { TECH_LIST } from '../data/technologies.js';

export function githubLangFor(skill: string): string | undefined {
  return TECH_LIST.find(t => t.canonical === skill)?.githubLanguage;
}

export function isImplied(skill: string, profile: GitHubProfile, _cv: ExtractedCV): boolean {
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
