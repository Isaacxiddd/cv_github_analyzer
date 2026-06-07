import { TECH_LIST, TECH_MAP } from './tech-list.js';
import type { ExtractedCV, ExperienceDate } from '../types/index.js';

// ─── Skill Extraction ─────────────────────────────────────────────────────────

export function extractSkills(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();

  for (const [alias, entry] of TECH_MAP) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
    if (pattern.test(lower)) {
      found.add(entry.canonical);
    }
  }

  // Deduplicate: if both "Node.js" and "Node" matched, keep canonical only
  const result = Array.from(found);
  return result.sort();
}

// ─── Date Extraction ─────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

const PRESENT_WORDS = /\b(present|current|actualidad|actual|hoy|today|now)\b/i;

function parseMonth(s: string): number | null {
  const lower = s.toLowerCase().slice(0, 3);
  return MONTH_MAP[lower] ?? null;
}

function parseYear(s: string): number | null {
  const n = parseInt(s, 10);
  return n >= 1990 && n <= 2030 ? n : null;
}

function toDate(year: number, month = 0): Date {
  return new Date(year, month, 1);
}

// Patterns: "2020 - 2023", "Jan 2020 – Mar 2023", "enero 2020 - presente"
const DATE_RANGE_PATTERNS: RegExp[] = [
  // "Month Year – Month Year"
  /([a-záéíóúA-Z]{3,10})\s+(\d{4})\s*[-–—]\s*([a-záéíóúA-Z]{3,10}|\bpresent\b|\bactual\b|\bhoy\b|\bcurrent\b)\s*(\d{4})?/gi,
  // "Year – Year" or "Year – present"
  /(\d{4})\s*[-–—]\s*(\d{4}|\bpresent\b|\bactual\b|\bhoy\b|\bcurrent\b)/gi,
];

const YEARS_CLAIMED_PATTERN =
  /(\d+(?:\.\d+)?)\+?\s*(?:años?|years?)\s*(?:de\s+)?(?:experience?|experiencia|working with|con|en|of)?\s*([A-Za-z.#+\s]{2,20})?/gi;

export function extractDates(text: string): ExperienceDate[] {
  const results: ExperienceDate[] = [];
  const lines = text.split('\n');

  for (const pattern of DATE_RANGE_PATTERNS) {
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const full = match[0];
      const context = lines.find(l => l.includes(full.slice(0, 10))) ?? full;
      let start: Date | null = null;
      let end: Date | null = null;

      if (/\d{4}/.test(match[1] ?? '')) {
        const y = parseYear(match[1]);
        if (y) start = toDate(y);
      } else {
        const mo = parseMonth(match[1] ?? '');
        const yr = parseYear(match[2] ?? '');
        if (mo !== null && yr) start = toDate(yr, mo);
      }

      const endPart = match[3] ?? '';
      if (PRESENT_WORDS.test(endPart)) {
        end = new Date();
      } else if (/\d{4}/.test(endPart)) {
        const y = parseYear(endPart);
        if (y) {
          const mo = parseMonth(match[3] ?? '');
          end = toDate(y, mo ?? 0);
        }
      } else if (match[4]) {
        const y = parseYear(match[4]);
        if (y) end = toDate(y);
      }

      const years = start && end
        ? Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365))
        : 0;

      results.push({ start, end, context: context.trim(), skill: null, yearsOfExperience: Math.round(years * 10) / 10 });
    }
  }

  // Extract "X years of Y" claims
  let claimMatch: RegExpExecArray | null;
  YEARS_CLAIMED_PATTERN.lastIndex = 0;
  while ((claimMatch = YEARS_CLAIMED_PATTERN.exec(text)) !== null) {
    const years = parseFloat(claimMatch[1]);
    const skill = claimMatch[2]?.trim() ?? null;
    const end = new Date();
    const start = new Date(end.getFullYear() - years, end.getMonth(), 1);
    results.push({ start, end, context: claimMatch[0].trim(), skill, yearsOfExperience: years });
  }

  return results;
}

// ─── GitHub Link Extraction ───────────────────────────────────────────────────

const GITHUB_PATTERN = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]{1,39})(?:\/[^\s"'<>]*)?\b/i;

export function extractGitHubLink(text: string): string | null {
  const match = GITHUB_PATTERN.exec(text);
  if (!match) return null;
  return `https://github.com/${match[1]}`;
}

export function extractGitHubUsername(text: string): string | null {
  const match = GITHUB_PATTERN.exec(text);
  return match?.[1] ?? null;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export function extractCV(rawText: string): ExtractedCV {
  return {
    skills: extractSkills(rawText),
    dates: extractDates(rawText),
    githubLink: extractGitHubLink(rawText),
    rawText,
  };
}
