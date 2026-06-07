import type {
  GitHubProfile,
  GitHubRepo,
  GitHubUser,
  Repository,
  CommitActivity,
} from '../types/index.js';

const BASE = 'https://api.github.com';

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function ghFetch<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers });

  if (res.status === 404) throw new GitHubNotFoundError(path);
  if (res.status === 403) throw new GitHubRateLimitError();
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${path}`);

  return res.json() as Promise<T>;
}

// ─── Repo analysis helpers ────────────────────────────────────────────────────

async function detectRepoFeatures(
  owner: string,
  repo: string,
  token?: string
): Promise<{ hasTests: boolean; hasCI: boolean; hasReadme: boolean; readmeWordCount: number }> {
  const [contents] = await Promise.allSettled([
    ghFetch<{ name: string }[]>(`/repos/${owner}/${repo}/contents`, token),
  ]);

  let hasTests = false;
  let hasCI = false;
  let hasReadme = false;
  let readmeWordCount = 0;

  if (contents.status === 'fulfilled') {
    const names = contents.value.map(f => f.name.toLowerCase());
    hasTests = names.some(n => ['test', 'tests', 'spec', '__tests__', 'e2e'].includes(n));
    hasCI = names.includes('.github');
    const readmeName = names.find(n => n.startsWith('readme'));
    if (readmeName) {
      hasReadme = true;
      try {
        const rm = await ghFetch<{ content: string }>(
          `/repos/${owner}/${repo}/contents/${readmeName}`,
          token
        );
        const decoded = atob(rm.content.replace(/\n/g, ''));
        readmeWordCount = decoded.split(/\s+/).filter(Boolean).length;
      } catch {
        readmeWordCount = 0;
      }
    }
  }

  return { hasTests, hasCI, hasReadme, readmeWordCount };
}

async function getLanguages(
  owner: string,
  repo: string,
  token?: string
): Promise<Record<string, number>> {
  try {
    return await ghFetch<Record<string, number>>(`/repos/${owner}/${repo}/languages`, token);
  } catch {
    return {};
  }
}

// ─── Main Fetcher ─────────────────────────────────────────────────────────────

export async function fetchGitHubProfile(
  username: string,
  token?: string
): Promise<GitHubProfile> {
  const [user, repos] = await Promise.all([
    ghFetch<GitHubUser>(`/users/${username}`, token),
    ghFetch<GitHubRepo[]>(`/users/${username}/repos?per_page=100&sort=pushed`, token),
  ]);

  const repoDetails = await Promise.allSettled(
    repos.slice(0, 30).map(async (r): Promise<Repository> => {
      const [languages, features] = await Promise.all([
        getLanguages(username, r.name, token),
        detectRepoFeatures(username, r.name, token),
      ]);

      const firstCommit = r.created_at ? new Date(r.created_at) : null;
      const lastCommit = r.pushed_at ? new Date(r.pushed_at) : null;

      return {
        name: r.name,
        primaryLanguage: r.language ?? '',
        languages,
        hasTests: features.hasTests,
        hasCI: features.hasCI,
        hasReadme: features.hasReadme,
        readmeWordCount: features.readmeWordCount,
        firstCommitDate: firstCommit,
        lastCommitDate: lastCommit,
        commitCount: 0,
        commitMessages: [],
        stars: r.stargazers_count,
        forks: r.forks_count,
      };
    })
  );

  const validRepos = repoDetails
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<Repository>).value);

  const languageStats = aggregateLanguages(validRepos);
  const commitActivity = computeCommitActivity(validRepos);

  return {
    username,
    name: user.name,
    bio: user.bio,
    repos: validRepos,
    languageStats,
    commitActivity,
    accountCreatedAt: user.created_at ? new Date(user.created_at) : null,
    followers: user.followers,
  };
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────

function aggregateLanguages(repos: Repository[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const repo of repos) {
    for (const [lang, bytes] of Object.entries(repo.languages)) {
      totals[lang] = (totals[lang] ?? 0) + bytes;
    }
  }
  return totals;
}

function computeCommitActivity(repos: Repository[]): CommitActivity {
  const now = Date.now();
  const cutoffs = { last30Days: 30, last90Days: 90, last365Days: 365 };
  const result: CommitActivity = { last30Days: 0, last90Days: 0, last365Days: 0 };

  for (const repo of repos) {
    if (!repo.lastCommitDate) continue;
    const daysAgo = (now - repo.lastCommitDate.getTime()) / (1000 * 60 * 60 * 24);
    for (const [key, days] of Object.entries(cutoffs) as [keyof CommitActivity, number][]) {
      if (daysAgo <= days) result[key]++;
    }
  }

  return result;
}

// ─── Custom Errors ────────────────────────────────────────────────────────────

export class GitHubNotFoundError extends Error {
  constructor(path: string) {
    super(`GitHub resource not found: ${path}`);
    this.name = 'GitHubNotFoundError';
  }
}

export class GitHubRateLimitError extends Error {
  constructor() {
    super('GitHub API rate limit exceeded. Try again later or sign in.');
    this.name = 'GitHubRateLimitError';
  }
}
