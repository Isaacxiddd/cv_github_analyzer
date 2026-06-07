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
      message: `No repos found using ${skill}`,
      evidence: `0 repos with ${lang} in GitHub language stats`,
    };
  }
  return null;
}
