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

async function detectAndStore(): Promise<void> {
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
    // Limit to 250KB to avoid chrome.storage.session quota (~1MB).
    const renderedText = (document.body?.innerText ?? '').slice(0, 50_000);
    const renderedHTML = (document.body?.innerHTML ?? '').slice(0, 200_000);
    try {
      await chrome.storage.session.set({
        cachedScrape: {
          url: window.location.href,
          renderedText,
          renderedHTML,
          detectedAt: Date.now(),
        },
      });
    } catch {
      // silently ignore storage quota errors
    }
  } else {
    const existing = await chrome.storage.session.get('detectedPortfolio');
    if (existing.detectedPortfolio?.url === window.location.href) {
      await chrome.storage.session.remove('detectedPortfolio');
      await chrome.storage.session.remove('cachedScrape');
    }
  }
}

detectAndStore();
