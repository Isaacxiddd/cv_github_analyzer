import { describe, it, expect } from 'vitest';
import { generateReport } from '../src/report/report-generator.js';
import type { AnalysisResult } from '../src/types/index.js';

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    flags: [],
    scores: { github: 80, cv: 75, coherence: 90, global: 82 },
    metadata: {
      analyzedAt: new Date('2024-01-01'),
      githubUsername: 'johndoe',
      totalRepos: 10,
      skillsFound: 8,
      skillsVerified: 7,
    },
    ...overrides,
  };
}

describe('generateReport', () => {
  it('returns a non-empty HTML string', () => {
    const html = generateReport(makeResult());
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(100);
  });

  it('includes the GitHub username', () => {
    const html = generateReport(makeResult());
    expect(html).toContain('@johndoe');
  });

  it('renders scores correctly', () => {
    const html = generateReport(makeResult());
    expect(html).toContain('80');
    expect(html).toContain('82');
  });

  it('shows "No inconsistencies" when flags array is empty', () => {
    const html = generateReport(makeResult({ flags: [] }));
    expect(html).toContain('No inconsistencies');
  });

  it('renders RED flag with correct label', () => {
    const html = generateReport(makeResult({
      flags: [{
        type: 'RED',
        skill: 'Rust',
        ruleId: 'NO_REPOS',
        message: 'No repos found using Rust',
        evidence: '0 repos with Rust',
      }],
    }));
    expect(html).toContain('Discrepancy');
    expect(html).toContain('Rust');
  });

  it('renders YELLOW flag', () => {
    const html = generateReport(makeResult({
      flags: [{ type: 'YELLOW', skill: 'Testing', ruleId: 'NO_TESTS', message: 'No tests', evidence: 'x repos' }],
    }));
    expect(html).toContain('Observation');
  });

  it('sorts RED flags before YELLOW', () => {
    const html = generateReport(makeResult({
      flags: [
        { type: 'YELLOW', skill: 'Y', ruleId: 'NO_TESTS', message: 'y', evidence: 'e' },
        { type: 'RED', skill: 'R', ruleId: 'NO_REPOS', message: 'r', evidence: 'e' },
      ],
    }));
    expect(html.indexOf('Discrepancy')).toBeLessThan(html.indexOf('Observation'));
  });

  it('includes metadata counts', () => {
    const html = generateReport(makeResult());
    expect(html).toContain('10');
    expect(html).toContain('8');
  });
});
