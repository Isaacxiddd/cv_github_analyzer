import type { ExtractedCV, GitHubProfile, AnalysisResult, Flag, Scores, RuleId } from '../types/index.js';
import { TECH_LIST } from '../parser/tech-list.js';

const LANGUAGE_TECHS = new Set(
  TECH_LIST.filter(t => t.category === 'language' && t.githubLanguage).map(t => t.canonical)
);

function githubLangFor(skill: string): string | undefined {
  return TECH_LIST.find(t => t.canonical === skill)?.githubLanguage;
}

// ─── Individual Rules ────────────────────────────────────────────────────────

function ruleNoRepos(skill: string, profile: GitHubProfile): Flag | null {
  const lang = githubLangFor(skill);
  if (!lang) return null;
  const hasLang = Object.keys(profile.languageStats).some(
    l => l.toLowerCase() === lang.toLowerCase()
  );
  if (!hasLang) {
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

function ruleRecentOnly(skill: string, profile: GitHubProfile): Flag | null {
  const lang = githubLangFor(skill);
  if (!lang) return null;
  const langRepos = profile.repos.filter(r => r.primaryLanguage.toLowerCase() === lang.toLowerCase());
  if (langRepos.length === 0) return null;

  const oldest = langRepos.reduce((min, r) => {
    if (!r.firstCommitDate) return min;
    return !min || r.firstCommitDate < min ? r.firstCommitDate : min;
  }, null as Date | null);

  if (!oldest) return null;
  const monthsOld = (Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsOld < 12) {
    return {
      type: 'YELLOW',
      skill,
      ruleId: 'RECENT_ONLY',
      message: `${skill} activity is recent (< 1 year)`,
      evidence: `Oldest ${lang} repo created ${Math.round(monthsOld)} months ago`,
    };
  }
  return null;
}

function ruleYearsMismatch(skill: string, profile: GitHubProfile, cv: ExtractedCV): Flag | null {
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

function ruleInactive(profile: GitHubProfile): Flag | null {
  const recentRepos = profile.repos.filter(r => {
    if (!r.lastCommitDate) return false;
    const daysAgo = (Date.now() - r.lastCommitDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 180;
  });
  if (recentRepos.length === 0 && profile.repos.length > 0) {
    return {
      type: 'YELLOW',
      skill: 'General Activity',
      ruleId: 'INACTIVE',
      message: 'No commits detected in the last 6 months',
      evidence: `Latest push: ${profile.repos[0]?.lastCommitDate?.toISOString().slice(0, 10) ?? 'unknown'}`,
    };
  }
  return null;
}

function ruleNoReadme(profile: GitHubProfile): Flag | null {
  if (profile.repos.length === 0) return null;
  const noReadme = profile.repos.filter(r => !r.hasReadme).length;
  const ratio = noReadme / profile.repos.length;
  if (ratio > 0.5) {
    return {
      type: 'YELLOW',
      skill: 'Documentation',
      ruleId: 'NO_README',
      message: `${Math.round(ratio * 100)}% of repos have no README`,
      evidence: `${noReadme} of ${profile.repos.length} repos lack documentation`,
    };
  }
  return null;
}

function ruleNoTests(profile: GitHubProfile): Flag | null {
  if (profile.repos.length === 0) return null;
  const noTests = profile.repos.filter(r => !r.hasTests).length;
  const ratio = noTests / profile.repos.length;
  if (ratio > 0.7) {
    return {
      type: 'YELLOW',
      skill: 'Testing',
      ruleId: 'NO_TESTS',
      message: `${Math.round(ratio * 100)}% of repos have no test directory`,
      evidence: `${noTests} of ${profile.repos.length} repos without /test or /spec`,
    };
  }
  return null;
}

function ruleNoCI(profile: GitHubProfile): Flag | null {
  if (profile.repos.length === 0) return null;
  const noCI = profile.repos.filter(r => !r.hasCI).length;
  const ratio = noCI / profile.repos.length;
  if (ratio > 0.9) {
    return {
      type: 'GRAY',
      skill: 'CI/CD',
      ruleId: 'NO_CI',
      message: 'No CI/CD configuration detected in repos',
      evidence: `${noCI} of ${profile.repos.length} repos without GitHub Actions`,
    };
  }
  return null;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function computeScores(flags: Flag[], cv: ExtractedCV, profile: GitHubProfile): Scores {
  const redFlags = flags.filter(f => f.type === 'RED').length;
  const yellowFlags = flags.filter(f => f.type === 'YELLOW').length;
  const skillFlags = flags.filter(f => f.ruleId === 'NO_REPOS' || f.ruleId === 'YEARS_MISMATCH').length;

  const totalSkills = cv.skills.filter(s => LANGUAGE_TECHS.has(s)).length || 1;
  const coherence = Math.max(0, 100 - (redFlags * 20 + yellowFlags * 8));
  const github = Math.min(100, Math.max(0,
    40 + (profile.commitActivity.last365Days * 2) +
    (profile.repos.filter(r => r.hasTests).length * 3) +
    (profile.repos.filter(r => r.hasCI).length * 2)
  ));
  const cv_score = Math.max(0, 100 - (skillFlags / totalSkills) * 50);
  const global = Math.round((coherence * 0.5 + github * 0.3 + cv_score * 0.2));

  return {
    github: Math.round(github),
    cv: Math.round(cv_score),
    coherence: Math.round(coherence),
    global,
  };
}

// ─── Main Checker ─────────────────────────────────────────────────────────────

export function runCrossCheck(cv: ExtractedCV, profile: GitHubProfile): AnalysisResult {
  const flags: Flag[] = [];
  const langSkills = cv.skills.filter(s => LANGUAGE_TECHS.has(s));

  for (const skill of langSkills) {
    const f1 = ruleNoRepos(skill, profile);
    if (f1) { flags.push(f1); continue; }
    const f2 = ruleRecentOnly(skill, profile);
    if (f2) flags.push(f2);
    const f3 = ruleYearsMismatch(skill, profile, cv);
    if (f3) flags.push(f3);
  }

  const inactiveFlag = ruleInactive(profile);
  if (inactiveFlag) flags.push(inactiveFlag);
  const readmeFlag = ruleNoReadme(profile);
  if (readmeFlag) flags.push(readmeFlag);
  const testsFlag = ruleNoTests(profile);
  if (testsFlag) flags.push(testsFlag);
  const ciFlag = ruleNoCI(profile);
  if (ciFlag) flags.push(ciFlag);

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
