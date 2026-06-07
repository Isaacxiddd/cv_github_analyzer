import { TECH_MAP } from '../data/technologies.js';

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

  const result = Array.from(found);
  return result.sort();
}
