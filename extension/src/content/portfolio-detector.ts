// Runs on all pages — detects portfolio/personal sites and stores the URL
// and the full rendered content (so the popup can parse skills even from SPAs).

const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'python', 'react', 'node', 'vue', 'angular',
  'developer', 'engineer', 'fullstack', 'frontend', 'backend', 'devops',
  'programming', 'software', 'coding', 'tech stack', 'technologies',
  'skills', 'tecnologías', 'habilidades', 'stack',
];

const EXPERIENCE_KEYWORDS = [
  'experience', 'work', 'employment', 'job', 'career', 'company',
  'experiencia', 'trabajo', 'empleo', 'empresa',
];

const GITHUB_URL_RE = /https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})(?:\/|$|\s|[\]"'>)]),/i;

function hasPortfolioSignals(): { isPortfolio: boolean; confidence: number } {
  const text = document.body?.innerText ?? '';
  const lower = text.toLowerCase();
  let score = 0;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const title = document.title.toLowerCase();
  const isPersonalSite = /(portfolio|personal|about me|curriculum|vita|cv|resume|about|contact)/i.test(title);
  if (isPersonalSite) score += 2;

  const skillCount = SKILL_KEYWORDS.filter(k => lower.includes(k)).length;
  if (skillCount >= 3) score += 2;
  else if (skillCount >= 1) score += 1;

  const expCount = EXPERIENCE_KEYWORDS.filter(k => lower.includes(k)).length;
  if (expCount >= 2) score += 2;
  else if (expCount >= 1) score += 1;

  const hasName = /^[A-Z][a-z]+ [A-Z][a-z]+$|^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/.test(
    lines.filter(l => l.length > 5 && l.length < 40)[0] ?? ''
  );
  if (hasName) score += 1;

  const hasGitHubLink = /github\.com\//i.test(lower);
  if (hasGitHubLink) score += 1;

  const hasLinkedIn = /linkedin\.com\/in\//i.test(lower);
  if (hasLinkedIn) score += 1;

  return { isPortfolio: score >= 4, confidence: score };
}

async function extractGitHubFromScripts(): Promise<string | null> {
  // Many SPAs store GitHub URLs as string literals in JS bundles.
  // The URL may not appear in the DOM (e.g. <button onClick> instead of <a href>).
  // Fetch external scripts and search for github.com patterns.
  const scripts = document.querySelectorAll('script[src]');
  const urls: string[] = [];

  for (const script of scripts) {
    const src = (script as HTMLScriptElement).src;
    if (!src || !/^https?:\/\//.test(src)) continue;
    try {
      const res = await fetch(src, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) continue;
      const code = await res.text();
      const matches = code.matchAll(new RegExp(GITHUB_URL_RE.source, 'gi'));
      for (const m of matches) {
        urls.push(`https://github.com/${m[1]}`);
      }
    } catch {
      // skip scripts that fail to fetch
    }
  }

  if (urls.length === 0) return null;

  // Prefer a profile URL (no extra path after username) over repo URLs
  const profileUrl = urls.find(u => GITHUB_URL_RE.exec(u)?.[1] && !u.split('/')[3]);
  return profileUrl ?? urls[0];
}

async function detectAndStore(): Promise<void> {
  try {
    const { isPortfolio, confidence } = hasPortfolioSignals();
    if (isPortfolio) {
      await chrome.storage.session.set({
        detectedPortfolio: {
          url: window.location.href,
          title: document.title,
          confidence,
          detectedAt: Date.now(),
        },
      });

      // Store full rendered DOM content so the popup can extract skills
      // even from SPAs where fetch() only gets an HTML shell.
      const renderedText = (document.body?.innerText ?? '').slice(0, 150_000);
      const renderedHTML = (document.body?.innerHTML ?? '').slice(0, 480_000);

      // Also try to extract GitHub URL from JS bundles (catches cases
      // where the URL is in a <button onClick> closure, not in the DOM).
      const scriptsUrl = await extractGitHubFromScripts();

      await chrome.storage.session.set({
        cachedScrape: {
          url: window.location.href,
          renderedText,
          renderedHTML,
          scriptsGithubUrl: scriptsUrl,
          detectedAt: Date.now(),
        },
      });
    } else {
      const { detectedPortfolio } = await chrome.storage.session.get('detectedPortfolio');
      if (detectedPortfolio?.url === window.location.href) {
        await chrome.storage.session.remove('detectedPortfolio');
        await chrome.storage.session.remove('cachedScrape');
      }
    }
  } catch {
    // storage not available in this context (e.g. about:blank, data:, iframe)
  }
}

// Immediate run for SSR pages.
detectAndStore();

// Watch DOM mutations for SPA frameworks (React, Vue, Astro, etc.)
// that render asynchronously after document_idle fires.
let debounce: ReturnType<typeof setTimeout>;
const observer = new MutationObserver(() => {
  clearTimeout(debounce);
  debounce = setTimeout(detectAndStore, 400);
});
if (document.body) observer.observe(document.body, { childList: true, subtree: true, characterData: true });

// Safety: stop observing after 15s
setTimeout(() => observer.disconnect(), 15_000);