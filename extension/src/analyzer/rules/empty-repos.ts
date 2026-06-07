import type { GitHubProfile, Flag, ExtractedCV } from '../../types/index.js';
import { TECH_LIST } from '../../data/technologies.js';
import { githubLangFor, isImplied } from '../language-utils.js';

const GITHUB_LANGS = new Set(
  TECH_LIST.filter(t => t.githubLanguage).map(t => t.canonical)
);

function matchesSkill(repo: GitHubProfile['repos'][number], skill: string): boolean {
  const gl = githubLangFor(skill);
  if (!gl) return false;
  return (
    repo.primaryLanguage === gl ||
    Object.keys(repo.languages).some(l => l === gl)
  );
}

export function ruleEmptyRepos(skill: string, profile: GitHubProfile, cv: ExtractedCV): Flag | null {
  if (!GITHUB_LANGS.has(skill)) return null;

  const impliedLang = githubLangFor(skill);
  if (!impliedLang) return null;

  const hasLang = Object.keys(profile.languageStats).some(
    l => l.toLowerCase() === impliedLang.toLowerCase()
  );
  if (!hasLang && !isImplied(skill, profile, cv)) return null;

  const matching = profile.repos.filter(r => matchesSkill(r, skill));
  if (matching.length === 0) return null;

  const allEmpty = matching.every(r => r.sizeKb === 0);
  if (!allEmpty) return null;

  return {
    type: 'YELLOW',
    skill,
    ruleId: 'EMPTY_REPOS',
    message: `${skill} repos exist but appear to be empty stubs`,
    evidence: `${matching.length} repo(s) with ${impliedLang} have no file content (0 KB) — likely placeholder repositories`,
  };
}
