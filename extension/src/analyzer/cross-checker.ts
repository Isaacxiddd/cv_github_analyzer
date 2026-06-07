import type { ExtractedCV, GitHubProfile, AnalysisResult, Flag, Scores } from '../types/index.js';
import { TECH_LIST } from '../data/technologies.js';
import { ruleNoRepos } from './rules/no-repos.js';
import { ruleRecentOnly } from './rules/recent-only.js';
import { ruleYearsMismatch } from './rules/years-mismatch.js';
import { ruleInactive } from './rules/inactive.js';
import { ruleNoReadme } from './rules/no-readme.js';
import { ruleNoTests } from './rules/no-tests.js';
import { ruleNoCI } from './rules/no-ci.js';
import { ruleEmptyRepos } from './rules/empty-repos.js';
import { ruleVerified } from './rules/verified.js';

const LANGUAGE_TECHS = new Set(
  TECH_LIST.filter(t => t.category === 'language' && t.githubLanguage).map(t => t.canonical)
);

function computeScores(flags: Flag[], cv: ExtractedCV, profile: GitHubProfile): Scores {
  const redFlags = flags.filter(f => f.type === 'RED').length;
  const yellowFlags = flags.filter(f => f.type === 'YELLOW').length;

  const totalSkills = cv.skills.filter(s => LANGUAGE_TECHS.has(s)).length || 1;

  // ── Coherence ─────────────────────────────────────────────────────────────
  const coherence = Math.max(0, 100 - (redFlags * 20 + yellowFlags * 8));

  // ── GitHub score ──────────────────────────────────────────────────────────
  const github = Math.min(100, Math.max(0,
    40 + (profile.commitActivity.last365Days * 2) +
    (profile.repos.filter(r => r.hasTests).length * 3) +
    (profile.repos.filter(r => r.hasCI).length * 2)
  ));

  // ── CV score ──────────────────────────────────────────────────────────────
  // Penalised per-skill only when there is zero GitHub evidence for a claimed
  // language.  Quality issues (empty repos, missing tests/CI/README) add small
  // secondary penalties because they reduce the credibility of the evidence.
  const skillPenalties = flags.filter(f =>
    f.ruleId === 'NO_REPOS' || f.ruleId === 'YEARS_MISMATCH'
  ).length;

  const qualityPenalties = flags.filter(f =>
    f.ruleId === 'NO_README' || f.ruleId === 'NO_TESTS' || f.ruleId === 'NO_CI'
  ).length;

  // Detect skills whose only GitHub repos are empty (0 commits) – they exist
  // as repos but prove nothing about the candidate's actual proficiency.
  const langSkills = cv.skills.filter(s => LANGUAGE_TECHS.has(s));
  const emptyReposPerSkill = langSkills.filter(skill => {
    const matching = profile.repos.filter(r =>
      r.primaryLanguage === skill ||
      (r.languages[skill] ?? 0) > 0
    );
    return matching.length > 0 && matching.every(r => r.commitCount === 0);
  }).length;

  const cv_score = Math.max(0, 100
    - (skillPenalties / totalSkills) * 50
    - (emptyReposPerSkill / totalSkills) * 25
    - qualityPenalties * 5
  );

  // ── Global ────────────────────────────────────────────────────────────────
  const global = Math.round((coherence * 0.5 + github * 0.3 + cv_score * 0.2));

  return {
    github: Math.round(github),
    cv: Math.round(cv_score),
    coherence: Math.round(coherence),
    global,
  };
}

export function runCrossCheck(cv: ExtractedCV, profile: GitHubProfile): AnalysisResult {
  const flags: Flag[] = [];
  const langSkills = cv.skills.filter(s => LANGUAGE_TECHS.has(s));

  for (const skill of langSkills) {
    const f1 = ruleNoRepos(skill, profile, cv);
    if (f1) { flags.push(f1); continue; }
    const f2 = ruleRecentOnly(skill, profile, cv);
    if (f2) flags.push(f2);
    const f3 = ruleYearsMismatch(skill, profile, cv);
    if (f3) flags.push(f3);
    const f4 = ruleEmptyRepos(skill, profile);
    if (f4) flags.push(f4);
  }

  const inactiveFlag = ruleInactive(profile);
  if (inactiveFlag) flags.push(inactiveFlag);
  const readmeFlag = ruleNoReadme(profile);
  if (readmeFlag) flags.push(readmeFlag);
  const testsFlag = ruleNoTests(profile);
  if (testsFlag) flags.push(testsFlag);
  const ciFlag = ruleNoCI(profile);
  if (ciFlag) flags.push(ciFlag);

  const flaggedSkills = new Set(flags.map(f => f.skill));
  for (const skill of langSkills) {
    if (!flaggedSkills.has(skill)) {
      flags.push(ruleVerified(skill));
    }
  }

  const verified = langSkills.filter(s => !flags.some(f => f.skill === s && f.type === 'RED')).length;

  return {
    flags,
    scores: computeScores(flags, cv, profile),
    metadata: {
      analyzedAt: new Date(),
      githubUsername: profile.username,
      totalRepos: profile.repos.length,
      skillsFound: cv.skills.length,
      skillsVerified: verified,
    },
  };
}
