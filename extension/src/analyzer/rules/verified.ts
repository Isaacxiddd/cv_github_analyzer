import type { Flag, GitHubProfile } from '../../types/index.js';
import { githubLangFor } from '../language-utils.js';

export function ruleVerified(skill: string, profile: GitHubProfile): Flag {
  const gl = githubLangFor(skill);
  const repos = gl
    ? profile.repos.filter(r => r.primaryLanguage === gl || (r.languages[gl] ?? 0) > 0)
    : [];
  const names = repos.slice(0, 3).map(r => r.name).join(', ');
  const extra = repos.length > 3 ? ` and ${repos.length - 3} more` : '';

  return {
    type: 'GREEN',
    skill,
    ruleId: 'VERIFIED',
      message: `${skill} evidence identified in public repositories`,
      evidence: `Found in ${repos.length} public repo(s): ${names}${extra}`,
  };
}
