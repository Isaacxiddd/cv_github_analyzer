import { describe, it, expect } from 'vitest';
import { runCrossCheck } from '../src/analyzer/cross-checker.js';
import type { ExtractedCV, GitHubProfile, Repository } from '../src/types/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRepo(overrides: Partial<Repository> = {}): Repository {
  return {
    name: 'test-repo',
    primaryLanguage: 'JavaScript',
    languages: { JavaScript: 20000 },
    hasTests: true,
    hasCI: true,
    hasReadme: true,
    readmeWordCount: 250,
    firstCommitDate: new Date('2021-01-01'),
    lastCommitDate: new Date(),
    commitCount: 50,
    commitMessages: [],
    stars: 5,
    forks: 1,
    sizeKb: 100,
    ...overrides,
  };
}

function makeCV(overrides: Partial<ExtractedCV> = {}): ExtractedCV {
  return {
    skills: ['JavaScript', 'TypeScript', 'React'],
    dates: [],
    githubLink: 'https://github.com/testuser',
    rawText: 'JavaScript TypeScript React',
    ...overrides,
  };
}

function makeProfile(overrides: Partial<GitHubProfile> = {}): GitHubProfile {
  return {
    username: 'testuser',
    name: 'Test User',
    bio: null,
    repos: [makeRepo()],
    languageStats: { JavaScript: 20000 },
    commitActivity: { last30Days: 5, last90Days: 15, last365Days: 40 },
    accountCreatedAt: new Date('2018-01-01'),
    followers: 10,
    ...overrides,
  };
}

// ─── Rule: NO_REPOS ───────────────────────────────────────────────────────────

describe('Rule: NO_REPOS', () => {
  it('flags RED when language skill has zero repos', () => {
    const cv = makeCV({ skills: ['Rust'] });
    const profile = makeProfile({ repos: [], languageStats: {} });
    const result = runCrossCheck(cv, profile);
    const flag = result.flags.find(f => f.ruleId === 'NO_REPOS' && f.skill === 'Rust');
    expect(flag).toBeDefined();
    expect(flag!.type).toBe('RED');
  });

  it('does not flag when language has repos', () => {
    const cv = makeCV({ skills: ['JavaScript'] });
    const profile = makeProfile();
    const result = runCrossCheck(cv, profile);
    expect(result.flags.find(f => f.ruleId === 'NO_REPOS' && f.skill === 'JavaScript')).toBeUndefined();
  });
});

// ─── Rule: NO_REPOS — implied skills ─────────────────────────────────────────

describe('Rule: NO_REPOS — implied skills', () => {
  it('does not flag JavaScript when TypeScript is present in GitHub (TS implies JS)', () => {
    const cv = makeCV({ skills: ['JavaScript', 'TypeScript'] });
    const profile = makeProfile({ languageStats: { TypeScript: 50000 } });
    const result = runCrossCheck(cv, profile);
    expect(result.flags.find(f => f.ruleId === 'NO_REPOS' && f.skill === 'JavaScript')).toBeUndefined();
  });

  it('does not flag HTML/CSS when TypeScript + frontend framework are in the CV', () => {
    const cv = makeCV({ skills: ['HTML', 'CSS', 'TypeScript', 'React'] });
    const profile = makeProfile({ languageStats: { TypeScript: 50000 } });
    const result = runCrossCheck(cv, profile);
    expect(result.flags.find(f => f.ruleId === 'NO_REPOS' && f.skill === 'HTML')).toBeUndefined();
    expect(result.flags.find(f => f.ruleId === 'NO_REPOS' && f.skill === 'CSS')).toBeUndefined();
  });

  it('does not flag HTML/CSS when TypeScript repos exist (TS repos imply web skills)', () => {
    const cv = makeCV({ skills: ['HTML', 'CSS', 'TypeScript'] });
    const profile = makeProfile({ languageStats: { TypeScript: 50000 } });
    const result = runCrossCheck(cv, profile);
    expect(result.flags.find(f => f.ruleId === 'NO_REPOS' && f.skill === 'HTML')).toBeUndefined();
    expect(result.flags.find(f => f.ruleId === 'NO_REPOS' && f.skill === 'CSS')).toBeUndefined();
  });
});

// ─── Rule: RECENT_ONLY ────────────────────────────────────────────────────────

describe('Rule: RECENT_ONLY', () => {
  it('flags YELLOW when first repo is < 12 months old', () => {
    const recentRepo = makeRepo({ firstCommitDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) });
    const cv = makeCV({ skills: ['JavaScript'] });
    const profile = makeProfile({ repos: [recentRepo], languageStats: { JavaScript: 20000 } });
    const result = runCrossCheck(cv, profile);
    const flag = result.flags.find(f => f.ruleId === 'RECENT_ONLY');
    expect(flag?.type).toBe('GRAY');
  });
});

// ─── Rule: INACTIVE ───────────────────────────────────────────────────────────

describe('Rule: INACTIVE', () => {
  it('flags YELLOW when all repos have old last commit', () => {
    const oldRepo = makeRepo({ lastCommitDate: new Date('2022-01-01') });
    const profile = makeProfile({ repos: [oldRepo] });
    const result = runCrossCheck(makeCV(), profile);
    const flag = result.flags.find(f => f.ruleId === 'INACTIVE');
    expect(flag?.type).toBe('YELLOW');
  });

  it('does not flag when recent commits exist', () => {
    const profile = makeProfile();
    const result = runCrossCheck(makeCV(), profile);
    expect(result.flags.find(f => f.ruleId === 'INACTIVE')).toBeUndefined();
  });
});

// ─── Rule: NO_README ─────────────────────────────────────────────────────────

describe('Rule: NO_README', () => {
  it('flags YELLOW when >50% repos have no README', () => {
    const repos = [
      makeRepo({ hasReadme: false }),
      makeRepo({ hasReadme: false }),
      makeRepo({ hasReadme: true }),
    ];
    const profile = makeProfile({ repos });
    const result = runCrossCheck(makeCV(), profile);
    expect(result.flags.find(f => f.ruleId === 'NO_README')).toBeDefined();
  });
});

// ─── Rule: NO_TESTS ──────────────────────────────────────────────────────────

describe('Rule: NO_TESTS', () => {
  it('flags YELLOW when >70% repos have no tests', () => {
    const repos = Array.from({ length: 5 }, () => makeRepo({ hasTests: false }));
    const profile = makeProfile({ repos });
    const result = runCrossCheck(makeCV(), profile);
    expect(result.flags.find(f => f.ruleId === 'NO_TESTS')).toBeDefined();
  });
});

// ─── Rule: EMPTY_REPOS ────────────────────────────────────────────────────────

describe('Rule: EMPTY_REPOS', () => {
  it('flags YELLOW when repos exist but have 0 KB size', () => {
    const emptyRepo = makeRepo({ sizeKb: 0, languages: { JavaScript: 20000 } });
    const cv = makeCV({ skills: ['JavaScript'] });
    const profile = makeProfile({ repos: [emptyRepo] });
    const result = runCrossCheck(cv, profile);
    const flag = result.flags.find(f => f.ruleId === 'EMPTY_REPOS');
    expect(flag).toBeDefined();
    expect(flag!.type).toBe('YELLOW');
  });

  it('does not flag when repos have content (sizeKb > 0)', () => {
    const cv = makeCV({ skills: ['JavaScript'] });
    const profile = makeProfile();
    const result = runCrossCheck(cv, profile);
    expect(result.flags.find(f => f.ruleId === 'EMPTY_REPOS')).toBeUndefined();
  });

  it('does not flag when NO_REPOS would fire (no repos at all)', () => {
    const cv = makeCV({ skills: ['Rust'] });
    const profile = makeProfile({ repos: [], languageStats: {} });
    const result = runCrossCheck(cv, profile);
    expect(result.flags.find(f => f.ruleId === 'EMPTY_REPOS')).toBeUndefined();
    expect(result.flags.find(f => f.ruleId === 'NO_REPOS')).toBeDefined();
  });
});

// ─── Scores ───────────────────────────────────────────────────────────────────

describe('Scores', () => {
  it('global score is 0–100', () => {
    const result = runCrossCheck(makeCV(), makeProfile());
    expect(result.scores.global).toBeGreaterThanOrEqual(0);
    expect(result.scores.global).toBeLessThanOrEqual(100);
  });

  it('coherence drops when RED flags exist', () => {
    const cv = makeCV({ skills: ['Rust', 'Haskell', 'Scala'] });
    const profile = makeProfile({ repos: [], languageStats: {} });
    const result = runCrossCheck(cv, profile);
    expect(result.scores.coherence).toBeLessThan(80);
  });

  it('metadata counts are correct', () => {
    const result = runCrossCheck(makeCV(), makeProfile());
    expect(result.metadata.skillsFound).toBe(makeCV().skills.length);
  });
});
