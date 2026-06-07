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
