import type { Flag } from '../../types/index.js';

export function ruleVerified(skill: string): Flag {
  return {
    type: 'GREEN',
    skill,
    ruleId: 'VERIFIED',
    message: `${skill} detected in GitHub repos`,
    evidence: `${skill} is present in CV and GitHub profile`,
  };
}
