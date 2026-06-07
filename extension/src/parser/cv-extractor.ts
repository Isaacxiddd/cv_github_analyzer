import { extractSkills } from './skills-extractor.js';
import { extractDates } from './dates-extractor.js';
import { extractGitHubLink, extractGitHubUsername } from './links-extractor.js';
import type { ExtractedCV } from '../types/index.js';

export { extractSkills, extractDates, extractGitHubLink, extractGitHubUsername };

export function extractCV(rawText: string): ExtractedCV {
  return {
    skills: extractSkills(rawText),
    dates: extractDates(rawText),
    githubLink: extractGitHubLink(rawText),
    rawText,
  };
}
