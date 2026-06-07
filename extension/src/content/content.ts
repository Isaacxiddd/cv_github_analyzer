// Runs on all pages — detects GitHub user on github.com and manages floating widget

import './widget.js';

function detectGitHubUser(): string | null {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="user-login"]');
  if (meta?.content) return meta.content;

  const avatarLink = document.querySelector<HTMLAnchorElement>('a[data-hovercard-type="user"]');
  if (avatarLink) {
    const match = avatarLink.href.match(/github\.com\/([a-zA-Z0-9-]+)/);
    if (match?.[1]) return match[1];
  }

  const profileMatch = location.pathname.match(/^\/([a-zA-Z0-9-]+)\/?$/);
  if (profileMatch?.[1] && !['login', 'signup', 'explore', 'marketplace'].includes(profileMatch[1])) {
    return profileMatch[1];
  }

  return null;
}

const username = detectGitHubUser();
if (username) {
  chrome.storage.session.set({ detectedGitHubUser: username });
}
