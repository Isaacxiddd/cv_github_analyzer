// AI narrative reports via Claude API — only called from backend, never from extension.

import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisResult } from '../../shared/types.js';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const SYSTEM_PROMPT = `You are a senior technical recruiter assistant.
Given a structured CV ↔ GitHub analysis result, write a concise professional
narrative (3–5 sentences) highlighting key findings. Be objective, mention
specific skills and evidence. Avoid filler phrases.`;

export async function generateNarrative(result: AnalysisResult): Promise<string> {
  const input = JSON.stringify({
    scores: result.scores,
    flags: result.flags.slice(0, 10),
    metadata: result.metadata,
  });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: input }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}
