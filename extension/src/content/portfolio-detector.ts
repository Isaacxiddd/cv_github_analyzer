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

const GITHUB_URL_RE = /https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})(?:\/[^\s"'()]*)?/gi;

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
  let foundProfile: string | null = null;
  let foundAny: string | null = null;

  for (const script of scripts) {
    const src = (script as HTMLScriptElement).src;
    if (!src || !/^https?:\/\//.test(src)) continue;
    try {
      const res = await fetch(src, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) continue;
      const code = await res.text();
      const matches = code.matchAll(GITHUB_URL_RE);
      for (const m of matches) {
        const url = `https://github.com/${m[1]}`;
        if (!foundAny) foundAny = url;
        // Profile URL = no extra path segment after the username
        if (!m[0].includes('/', m[0].indexOf(m[1]) + m[1].length)) {
          if (!foundProfile) foundProfile = url;
        }
      }
    } catch {
      // skip scripts that fail to fetch
    }
  }

  return foundProfile ?? foundAny;
}

// Shared promise so that both detectAndStore() and the onMessage handler
// can await the same JS bundle fetch without duplicating work.
let scriptsGithubUrlPromise: Promise<string | null> | null = null;
let scriptsFetched = false;

function ensureScriptsFetched(): Promise<string | null> {
  if (!scriptsGithubUrlPromise) {
    scriptsGithubUrlPromise = extractGitHubFromScripts();
  }
  return scriptsGithubUrlPromise;
}

// ─── React props scanner ──────────────────────────────────────────────────────
// React stores event handler props (onClick, onMouseDown, etc.) as plain JS
// objects on DOM elements with a key like __reactProps$<hash>.  We can read
// the handler's source via toString() and extract GitHub URLs from it.

const HANDLER_PROPS = ['onClick', 'onMouseDown', 'onTouchEnd', 'onPointerDown', 'onAuxClick'];

function findGitHubInReactProps(): string | null {
  for (const el of document.querySelectorAll('button, a, [role="button"]')) {
    for (const key of Object.keys(el)) {
      if (!key.startsWith('__reactProps$') && !key.startsWith('__reactEventHandlers$')) continue;
      const props = (el as any)[key];
      if (!props) continue;
      for (const hp of HANDLER_PROPS) {
        const handler = props[hp];
        if (typeof handler !== 'function') continue;
        try {
          const src = handler.toString();
          const m = src.match(/https?:\/\/(?:www\.)?github\.com\/([^\s"'`]+)/i);
          if (m) return m[0].replace(/\/+$/, '');
        } catch {
          // some built-in functions throw on toString
        }
      }
    }
  }
  return null;
}

// ─── Live DOM query (popup requests this on user click) ──────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'getGithubFromDOM') {
    (async () => {
      // 1. <a href> elements
      for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href*="github.com"]')) {
        const url = a.href.replace(/\/+$/, '');
        const isProfile = !url.replace(/^https?:\/\/github\.com\//i, '').includes('/');
        if (isProfile) { sendResponse({ url }); return; }
      }

      // 2. React props (onClick / onMouseDown with window.open('github.com/...'))
      const reactUrl = findGitHubInReactProps();
      if (reactUrl) { sendResponse({ url: reactUrl, source: 'react' }); return; }

      // 3. Any DOM attribute containing "github.com"
      for (const el of document.querySelectorAll<HTMLElement>('*')) {
        for (const attr of el.attributes) {
          if ((attr.value ?? '').toLowerCase().includes('github.com') && attr.name !== 'href') {
            const m = attr.value.match(/https?:\/\/(?:www\.)?github\.com\/[^\s"'`]+/i);
            if (m) { sendResponse({ url: m[0].replace(/\/+$/, '') }); return; }
          }
        }
      }

      // 4. innerText
      const bodyText = document.body?.innerText ?? '';
      const textMatch = bodyText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
      if (textMatch) { sendResponse({ url: `https://github.com/${textMatch[1]}` }); return; }

      // 5. Fallback: fetch JS bundles (slow but catches deeply buried closures)
      const bundleUrl = await ensureScriptsFetched();
      sendResponse({ url: bundleUrl, source: 'bundle' });
    })();
    return true; // keep channel open for async response
  }
});

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

      // Store full rendered DOM content immediately (so the popup can
      // access it right away), then update with JS bundle URLs later.
      const renderedText = (document.body?.innerText ?? '').slice(0, 150_000);
      const renderedHTML = (document.body?.innerHTML ?? '').slice(0, 480_000);

      const baseEntry = {
        url: window.location.href,
        renderedText,
        renderedHTML,
        scriptsGithubUrl: null as string | null,
        detectedAt: Date.now(),
      };
      await chrome.storage.session.set({ cachedScrape: baseEntry });

      // Fire-and-forget: update cache when JS bundle fetch completes.
      if (!scriptsFetched) {
        scriptsFetched = true;
        ensureScriptsFetched().then(scriptsUrl => {
          if (!scriptsUrl) return;
          chrome.storage.session.get('cachedScrape').then(({ cachedScrape }) => {
            if (cachedScrape?.url === window.location.href) {
              cachedScrape.scriptsGithubUrl = scriptsUrl;
              chrome.storage.session.set({ cachedScrape });
            }
          });
        });
      }
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