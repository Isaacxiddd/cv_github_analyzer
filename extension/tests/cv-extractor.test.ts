import { describe, it, expect } from 'vitest';
import { extractSkills, extractDates, extractGitHubLink, extractGitHubUsername } from '../src/parser/cv-extractor.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures/cv-samples', name), 'utf-8');

// ─── extractSkills ────────────────────────────────────────────────────────────

describe('extractSkills', () => {
  it('detects canonical skill names', () => {
    const skills = extractSkills('I work with React and Node.js');
    expect(skills).toContain('React');
    expect(skills).toContain('Node.js');
  });

  it('detects aliases (ReactJS → React)', () => {
    expect(extractSkills('Built with ReactJS')).toContain('React');
    expect(extractSkills('Using VueJS')).toContain('Vue');
    expect(extractSkills('NodeJS backend')).toContain('Node.js');
  });

  it('is case-insensitive', () => {
    expect(extractSkills('typescript project')).toContain('TypeScript');
    expect(extractSkills('PYTHON script')).toContain('Python');
  });

  it('does not false-positive on partial words', () => {
    const result = extractSkills('Reactor nuclear engineering');
    expect(result).not.toContain('React');
  });

  it('parses senior-dev fixture correctly', () => {
    const text = fixture('senior-dev.txt');
    const skills = extractSkills(text);
    expect(skills).toContain('JavaScript');
    expect(skills).toContain('TypeScript');
    expect(skills).toContain('React');
    expect(skills).toContain('Node.js');
    expect(skills).toContain('PostgreSQL');
    expect(skills).toContain('Docker');
  });

  it('returns empty array when no skills found', () => {
    expect(extractSkills('Hello world, my name is John.')).toEqual([]);
  });

  it('deduplicates: does not return same skill twice', () => {
    const skills = extractSkills('React ReactJS React.js');
    const reactCount = skills.filter(s => s === 'React').length;
    expect(reactCount).toBe(1);
  });
});

// ─── extractDates ─────────────────────────────────────────────────────────────

describe('extractDates', () => {
  it('extracts year range "2020 - 2023"', () => {
    const dates = extractDates('Worked there 2020 - 2023');
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0].start?.getFullYear()).toBe(2020);
    expect(dates[0].end?.getFullYear()).toBe(2023);
    expect(dates[0].yearsOfExperience).toBeCloseTo(3, 0);
  });

  it('handles "present" / "current" as end date', () => {
    const dates = extractDates('January 2021 – present');
    expect(dates.length).toBeGreaterThan(0);
    const d = dates[0];
    expect(d.end).toBeDefined();
    expect(d.end!.getFullYear()).toBe(new Date().getFullYear());
  });

  it('extracts "3 years of experience with Python"', () => {
    const dates = extractDates('3 years of experience with Python');
    const match = dates.find(d => d.skill?.toLowerCase().includes('python'));
    expect(match).toBeDefined();
    expect(match!.yearsOfExperience).toBeCloseTo(3, 0);
  });

  it('returns empty array for text with no dates', () => {
    expect(extractDates('I like cooking and hiking.')).toEqual([]);
  });
});

// ─── extractGitHubLink ────────────────────────────────────────────────────────

describe('extractGitHubLink', () => {
  it('extracts bare github.com/user', () => {
    expect(extractGitHubLink('github.com/johndoe')).toBe('https://github.com/johndoe');
  });

  it('extracts https://github.com/user', () => {
    expect(extractGitHubLink('https://github.com/torvalds')).toBe('https://github.com/torvalds');
  });

  it('returns null when no link present', () => {
    expect(extractGitHubLink('No link here at all')).toBeNull();
  });

  it('ignores github.com/username/repo paths — returns just user', () => {
    const link = extractGitHubLink('See https://github.com/johndoe/my-project');
    expect(link).toBe('https://github.com/johndoe');
  });

  it('extracts from senior-dev fixture', () => {
    const text = fixture('senior-dev.txt');
    expect(extractGitHubLink(text)).toBe('https://github.com/johndoe');
  });
});

describe('extractGitHubUsername', () => {
  it('returns just the username', () => {
    expect(extractGitHubUsername('github.com/isaacxiddd')).toBe('isaacxiddd');
  });
});
