import type { ExperienceDate } from '../types/index.js';

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

const DATE_RANGE_PATTERNS: RegExp[] = [
  /([a-záéíóúA-Z]{3,10})\s+(\d{4})\s*[-–—]\s*([a-záéíóúA-Z]{3,10}|\bpresent\b|\bactual\b|\bhoy\b|\bcurrent\b)\s*(\d{4})?/gi,
  /(\d{4})\s*[-–—]\s*(\d{4}|\bpresent\b|\bactual\b|\bhoy\b|\bcurrent\b)/gi,
];

const YEARS_CLAIMED_PATTERN =
  /(\d+(?:\.\d+)?)\+?\s*(?:años?|years?)\s+(?:of\s+experience\s+(?:with|in|using)\s+|de\s+experiencia\s+(?:con|en)\s+|(?:de|of|con|en|with|using)\s+)([A-Za-z][A-Za-z.#+]{1,20})/gi;

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

      const isYearOnlyStart = /^\d{4}$/.test((match[1] ?? '').trim());

      if (isYearOnlyStart) {
        const y = parseYear(match[1]);
        if (y) start = toDate(y);
        const endPart = (match[2] ?? '').trim();
        if (PRESENT_WORDS.test(endPart)) end = new Date();
        else { const ey = parseYear(endPart); if (ey) end = toDate(ey); }
      } else {
        const mo = parseMonth(match[1] ?? '');
        const yr = parseYear(match[2] ?? '');
        if (mo !== null && yr) start = toDate(yr, mo);
        const endPart = (match[3] ?? '').trim();
        if (PRESENT_WORDS.test(endPart)) end = new Date();
        else {
          const emo = parseMonth(endPart);
          const eyr = parseYear(match[4] ?? '');
          if (eyr) end = toDate(eyr, emo ?? 0);
        }
      }

      const years = start && end
        ? Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365))
        : 0;

      results.push({ start, end, context: context.trim(), skill: null, yearsOfExperience: Math.round(years * 10) / 10 });
    }
  }

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
