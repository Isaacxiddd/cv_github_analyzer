import type { Flag, ExtractedCV, GitHubProfile } from '../../types/index.js';
import { githubLangFor, isImplied } from '../language-utils.js';

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
      message: `No public ${skill} repos found`,
      evidence: `0 GitHub repos with ${lang} in language stats — skill claimed in CV but no observable GitHub activity in this language`,
    };
  }
  return null;
}
