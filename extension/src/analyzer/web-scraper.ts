import { extractSkills, extractDates, extractGitHubLink } from '../parser/cv-extractor.js';
import { TECH_LIST } from '../data/technologies.js';
import type { ExtractedCV, ScrapedPortfolio } from '../types/index.js';

// ─── Seniority detection ────────────────────────────────────────────────────
// Strategy (in priority order):
//   1. Years of experience — parse explicit numbers ("3 years", "10+ años", "2018–2024")
//   2. Title/bio keywords — only from first screen of text (avoids testimonial pollution)
//   3. Fallback — full-text keyword scan (low confidence)

const YEARS_RE = [
  /(\d{1,2})\s*(?:\+|más\s*de\s*)?\s*(?:years?|años?|yr)s?(?:\s+(?:of|de)\s+(?:experience|experiencia))?/gi,
  /(?:más\s+de|over|more\s+than|>)\s*(\d{1,2})\s*(?:years?|años?|yr)s?/gi,
];

const DATE_RANGE_RE = /(\d{4})\s*[–\-—/]+\s*(\d{4}|present|current|actualidad|ahora)/gi;

const SENIOR_TITLES = [
  'senior', 'sr.', 'lead', 'tech lead', 'principal', 'staff', 'architect',
  'head of', 'engineering manager', 'vp of',
];

const MID_TITLES = [
  'mid level', 'mid-level', 'intermediate', 'semi-senior', 'semi senior', 'ssr',
  'software developer', 'software engineer', 'fullstack', 'full stack',
  'desarrollador', 'desarrolladora', 'ingeniero', 'ingeniera', 'programador',
];

const JUNIOR_TITLES = [
  'junior', 'jr.', 'entry level', 'entry-level', 'intern', 'trainee',
  'graduate', 'recent graduate', 'bootcamp', 'fresher', 'associate developer',
];

function extractYearsOfExperience(text: string): number {
  const lower = text.toLowerCase();
  let maxYears = 0;

  // "3 years", "10 años", "5+ years", "más de 10 años"
  for (const re of YEARS_RE) {
    const matches = lower.matchAll(re);
    for (const m of matches) {
      const y = parseInt(m[1], 10);
      if (y > 0 && y <= 50) maxYears = Math.max(maxYears, y);
    }
  }

  // "2018 - 2024", "2020–present"
  const ranges = lower.matchAll(DATE_RANGE_RE);
  for (const m of ranges) {
    const start = parseInt(m[1], 10);
    if (start < 2000 || start > 2030) continue;
    const endStr = m[2].toLowerCase();
    const end = (endStr === 'present' || endStr === 'current' || endStr === 'actualidad' || endStr === 'ahora')
      ? new Date().getFullYear()
      : parseInt(m[2], 10);
    if (end >= start && end <= 2030) {
      maxYears = Math.max(maxYears, end - start);
    }
  }

  return maxYears;
}

function detectSeniority(text: string): ScrapedPortfolio['seniority'] {
  const lower = text.toLowerCase();

  // 1. Years-based (most reliable)
  const years = extractYearsOfExperience(text);
  if (years >= 7) return { level: 'senior', confidence: 'high', signals: [`${years}+ years`] };
  if (years >= 4) return { level: 'mid', confidence: 'high', signals: [`${years} years`] };
  if (years >= 1) return { level: 'junior', confidence: 'high', signals: [`${years} year(s)`] };

  // 2. Title/bio keywords — only in first 600 chars to avoid testimonial pollution
  const header = lower.slice(0, 600);
  const hasSenior = SENIOR_TITLES.some(t => header.includes(t));
  const hasMid = MID_TITLES.some(t => header.includes(t));
  const hasJunior = JUNIOR_TITLES.some(t => header.includes(t));

  if (hasSenior) return { level: 'senior', confidence: 'medium', signals: ['title match'] };
  if (hasMid) return { level: 'mid', confidence: 'medium', signals: ['title match'] };
  if (hasJunior) return { level: 'junior', confidence: 'medium', signals: ['title match'] };

  // 3. Full-text keyword scan (low confidence, may pick up testimonials)
  const fullHasSenior = SENIOR_TITLES.some(t => lower.includes(t));
  const fullHasMid = MID_TITLES.some(t => lower.includes(t));
  const fullHasJunior = JUNIOR_TITLES.some(t => lower.includes(t));

  if (fullHasSenior) return { level: 'senior', confidence: 'low', signals: ['full-text keyword'] };
  if (fullHasMid) return { level: 'mid', confidence: 'low', signals: ['full-text keyword'] };
  if (fullHasJunior) return { level: 'junior', confidence: 'low', signals: ['full-text keyword'] };

  return { level: 'unknown', confidence: 'low', signals: [] };
}

// ─── DOM cleaning ────────────────────────────────────────────────────────────

function cleanHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── Section extractors ──────────────────────────────────────────────────────

function extractExperience(text: string): ScrapedPortfolio['experience'] {
  const results: ScrapedPortfolio['experience'] = [];

  const patterns = [
    /([A-Z][^\n.]{3,50}?)\s+(?:at|@|–|en)\s+([A-Z][^\n.]{2,40}?)[\s·,]+(\d{4}[\s\–\-—to]+\d{4}|present|current|actualidad)/gi,
    /([A-Z][^\n|]{2,40}?)\s*\|\s*([^\n|]{3,50}?)\s*\|\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[\s\d]{4,}[\s\-–—]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current)?[\s\d]*)/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null && results.length < 10) {
      results.push({
        company: (match[2] ?? match[1] ?? '').trim(),
        role: (match[1] ?? '').trim(),
        dates: (match[3] ?? '').trim(),
      });
    }
  }

  return results;
}

function extractEducation(text: string): string[] {
  const lines = text.split(/\n|\. /);
  const keywords = [
    'university', 'universidad', 'college', 'institute', 'bachelor',
    'master', 'degree', 'b.sc', 'm.sc', 'engineering', 'computer science',
    'licenciatura', 'ingeniería', 'técnico', 'bootcamp',
  ];

  const found = lines.filter(l => {
    const lower = l.toLowerCase();
    return keywords.some(k => lower.includes(k)) && l.length > 10 && l.length < 200;
  });

  return [...new Set(found)].slice(0, 5);
}

function extractLinks(html: string): ScrapedPortfolio['links'] {
  const links: ScrapedPortfolio['links'] = {};

  const github = html.match(/https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (github) links.github = github[0];

  const linkedin = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (linkedin) links.linkedin = linkedin[0];

  const twitter = html.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/i);
  if (twitter) links.twitter = twitter[0];

  return links;
}

function extractName(html: string, text: string): string | null {
  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
  if (og) return og[1].replace(/\s*[-|–]\s*.+$/, '').trim();

  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title) return title[1].replace(/\s*[-|–]\s*.+$/, '').trim();

  const h1 = html.match(/<h1[^>]*>([^<]{2,60})<\/h1>/i);
  if (h1) return h1[1].trim();

  return null;
}

function extractTitle(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const keywords = [
    'developer', 'engineer', 'designer', 'architect', 'fullstack',
    'frontend', 'backend', 'devops', 'data scientist', 'ml engineer',
    'desarrollador', 'ingeniero', 'programador',
  ];

  for (const line of lines.slice(0, 20)) {
    if (keywords.some(k => line.toLowerCase().includes(k)) && line.length < 80) {
      return line;
    }
  }
  return null;
}

function extractBio(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 60);
  for (const line of lines.slice(0, 30)) {
    if (line.length > 80 && line.length < 500) return line;
  }
  return null;
}

function extractTechsFromHTML(html: string): string[] {
  const techs = new Set<string>();

  const iconMatches = html.matchAll(/devicon-([a-z0-9]+)-|simple-icons--([a-z0-9]+)/gi);
  for (const match of iconMatches) {
    const name = (match[1] || match[2]).toLowerCase();
    const found = TECH_LIST.find(
      t => t.canonical.toLowerCase() === name || t.aliases.some(a => a.toLowerCase() === name)
    );
    if (found) techs.add(found.canonical);
  }

  const badgeMatches = html.matchAll(
    /shields\.io\/badge\/([^?/"&]+)|badge\.fury\.io\/[^"]+\/([^"]+)/gi
  );
  for (const match of badgeMatches) {
    const raw = decodeURIComponent(match[1] || match[2] || '')
      .split('-')[0]
      .toLowerCase();
    const found = TECH_LIST.find(
      t => t.canonical.toLowerCase() === raw || t.aliases.some(a => a.toLowerCase() === raw)
    );
    if (found) techs.add(found.canonical);
  }

  return [...techs];
}

// ─── SPA cache (from content script) ──────────────────────────────────────────

async function getCachedScrape(url: string): Promise<{ html: string; text: string; scriptsGithubUrl?: string } | null> {
  try {
    const { cachedScrape } = await chrome.storage.session.get('cachedScrape');
    if (
      cachedScrape &&
      cachedScrape.url === url &&
      Date.now() - cachedScrape.detectedAt < 300_000
    ) {
      // Reconstruct a full HTML document from the rendered DOM content
      const html = `<!DOCTYPE html><html><head><title>${cachedScrape.url}</title></head><body>${cachedScrape.renderedHTML}</body></html>`;
      return { html, text: cachedScrape.renderedText, scriptsGithubUrl: cachedScrape.scriptsGithubUrl };
    }
  } catch {
    // chrome.storage.session may not be available (e.g. in tests)
  }
  return null;
}

const GITHUB_HANDLE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

function extractGitHubHandle(text: string): string | null {
  // "GitHub: @user", "Github/User", "github: user", "gh: user"
  // also "@user" near "github" context, and "github.com/user"
  const patterns = [
    /(?:^|\s)github[:\s/]+@?([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\b/i,
    /(?:^|\s)gh[:\s/]+@?([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\b/i,
    /(?:^|\s)github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})(?:\/|$|\s|\.)/i,
  ];

  for (const pat of patterns) {
    const match = pat.exec(text);
    if (match && GITHUB_HANDLE.test(match[1])) return match[1];
  }

  return null;
}

function extractMetaDescription(html: string): string {
  const match = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
  return match ? match[1].trim() : '';
}

// ─── Main scrape ──────────────────────────────────────────────────────────────

export async function scrapePortfolio(url: string): Promise<ScrapedPortfolio> {
  // 1. Try cached scrape from content script (handles SPAs)
  const cached = await getCachedScrape(url);

  let html: string;
  let rawText: string;

  if (cached) {
    html = cached.html;
    rawText = cached.text;
  } else {
    // 2. Fallback: HTTP fetch
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CVGitHubAnalyzer/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (err) {
      throw new Error(
        `Could not fetch portfolio: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // 3. Extract meta description for pages with SSR content in <head>
    const metaDesc = extractMetaDescription(html);
    const cleaned = cleanHTML(html);
    rawText = metaDesc ? `${metaDesc}\n${cleaned}` : cleaned;
  }

  const textSkills = extractSkills(rawText);
  const htmlSkills = extractTechsFromHTML(html);
  const allSkills = [...new Set([...textSkills, ...htmlSkills])];

  const links = extractLinks(html);
  const githubLink = extractGitHubLink(rawText) ?? links.github ?? null;

  // Broader GitHub username extraction from text (not just URLs)
  if (!githubLink && !links.github) {
    const userFromText = extractGitHubHandle(rawText);
    if (userFromText) links.github = `https://github.com/${userFromText}`;
  }

  // Fallback: GitHub URL extracted from JS bundles by the content script
  // (catches URLs in <button onClick> or event handlers, not visible in DOM)
  if (!githubLink && !links.github && cached?.scriptsGithubUrl) {
    links.github = cached.scriptsGithubUrl;
  }

  return {
    name: extractName(html, rawText),
    title: extractTitle(rawText),
    bio: extractBio(rawText),
    skills: allSkills,
    experience: extractExperience(rawText),
    education: extractEducation(rawText),
    links,
    seniority: detectSeniority(rawText),
    rawText,
  };
}

// ─── Adapter: ScrapedPortfolio → ExtractedCV (for cross-checker) ─────────────

export function portfolioToExtractedCV(portfolio: ScrapedPortfolio): ExtractedCV {
  return {
    skills: portfolio.skills,
    dates: extractDates(portfolio.rawText),
    githubLink: portfolio.links.github ?? null,
    rawText: portfolio.rawText,
  };
}
