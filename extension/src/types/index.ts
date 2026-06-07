// ─── CV Extraction ────────────────────────────────────────────────────────────

export interface ExperienceDate {
  start: Date | null;
  end: Date | null;
  context: string;
  skill: string | null;
  yearsOfExperience: number;
}

// ─── Web Scraper (portfolio) ───────────────────────────────────────────────────

export interface SeniorityResult {
  level: 'junior' | 'mid' | 'senior' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
}

export interface ScrapedPortfolio {
  name: string | null;
  title: string | null;
  bio: string | null;
  skills: string[];
  experience: {
    company: string;
    role: string;
    dates: string;
  }[];
  education: string[];
  links: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  seniority: SeniorityResult;
  rawText: string;
}

export interface ExtractedCV {
  skills: string[];
  dates: ExperienceDate[];
  githubLink: string | null;
  rawText: string;
}

// ─── GitHub Data ──────────────────────────────────────────────────────────────

export interface Repository {
  name: string;
  primaryLanguage: string;
  languages: Record<string, number>;
  hasTests: boolean;
  hasCI: boolean;
  hasReadme: boolean;
  readmeWordCount: number;
  firstCommitDate: Date | null;
  lastCommitDate: Date | null;
  commitCount: number;
  commitMessages: string[];
  stars: number;
  forks: number;
}

export interface CommitActivity {
  last30Days: number;
  last90Days: number;
  last365Days: number;
}

export interface GitHubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  repos: Repository[];
  languageStats: Record<string, number>;
  commitActivity: CommitActivity;
  accountCreatedAt: Date | null;
  followers: number;
}

// ─── Analysis / Flags ─────────────────────────────────────────────────────────

export type FlagType = 'RED' | 'YELLOW' | 'GREEN' | 'GRAY';

export type RuleId =
  | 'NO_REPOS'
  | 'RECENT_ONLY'
  | 'YEARS_MISMATCH'
  | 'NO_README'
  | 'NO_TESTS'
  | 'INACTIVE'
  | 'NO_CI'
  | 'VERIFIED';

export interface Flag {
  type: FlagType;
  skill: string;
  ruleId: RuleId;
  message: string;
  evidence: string;
}

export interface Scores {
  github: number;
  cv: number;
  coherence: number;
  global: number;
}

export interface AnalysisResult {
  flags: Flag[];
  scores: Scores;
  metadata: {
    analyzedAt: Date;
    githubUsername: string;
    totalRepos: number;
    skillsFound: number;
    skillsVerified: number;
  };
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryFlag {
  level: 'red' | 'yellow' | 'green' | 'gray';
  skill: string;
  reason: string;
}

export interface HistoryEntry {
  id: string;
  github_username: string;
  cv_filename: string;
  score_github: number;
  score_cv: number;
  score_coherence: number;
  score_global: number;
  flags: HistoryFlag[];
  analyzed_at: string;
  result: AnalysisResult;
}

export const HISTORY_KEY = 'analysis_history';

// ─── Messages (popup ↔ background, content ↔ background) ────────────────────

export interface AnalyzeRequest {
  type: 'ANALYZE';
  cvText: string;
  githubUsername: string;
  token?: string;
}

export interface AnalyzeResponse {
  type: 'ANALYZE_RESULT';
  result: AnalysisResult;
}

export interface AnalyzeError {
  type: 'ANALYZE_ERROR';
  message: string;
}

export interface WidgetShow {
  type: 'WIDGET_SHOW';
  entry: HistoryEntry;
}

export interface WidgetHide {
  type: 'WIDGET_HIDE';
}

export type BackgroundMessage = AnalyzeRequest | WidgetShow | WidgetHide;
export type BackgroundResponse = AnalyzeResponse | AnalyzeError;

// ─── GitHub fetcher internal types ───────────────────────────────────────────

export interface GitHubRepo {
  name: string;
  language: string | null;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  pushed_at: string;
  size: number;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  created_at: string;
}
