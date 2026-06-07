import type { GitHubProfile, Flag } from '../../types/index.js';
import { TECH_LIST } from '../../data/technologies.js';

const LANGUAGE_TECHS = new Set(
  TECH_LIST.filter(t => t.category === 'language' && t.githubLanguage).map(t => t.canonical)
);

export function ruleEmptyRepos(skill: string, profile: GitHubProfile): Flag | null {
  if (!LANGUAGE_TECHS.has(skill)) return null;

  const matching = profile.repos.filter(r =>
    r.primaryLanguage === skill ||
    (r.languages[skill] ?? 0) > 0
  );

  if (matching.length === 0) return null;

  const allEmpty = matching.every(r => r.commitCount === 0);
  if (!allEmpty) return null;

  return {
    type: 'YELLOW',
    skill,
    ruleId: 'EMPTY_REPOS',
    message: `${skill} repos exist but have no commits`,
    evidence: `${matching.length} repo(s) with ${skill} language have 0 commits`,
  };
}
