// Runs on github.com/* — detects the active username and stores it so
// the popup can pre-fill the username field without the user typing it.

function detectGitHubUser(): string | null {
  // Profile pages: github.com/username
  const meta = document.querySelector<HTMLMetaElement>('meta[name="user-login"]');
  if (meta?.content) return meta.content;

  // Fallback: read from the avatar link in the nav
  const avatarLink = document.querySelector<HTMLAnchorElement>('a[data-hovercard-type="user"]');
  if (avatarLink) {
    const match = avatarLink.href.match(/github\.com\/([a-zA-Z0-9-]+)/);
    if (match?.[1]) return match[1];
  }

  // Profile page URL itself
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
