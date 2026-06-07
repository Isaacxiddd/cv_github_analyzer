import type { AnalysisResult, Flag, FlagType } from '../types/index.js';

const FLAG_COLORS: Record<FlagType, { bg: string; text: string; label: string }> = {
  RED:    { bg: '#fee2e2', text: '#991b1b', label: '🔴 High inconsistency' },
  YELLOW: { bg: '#fef9c3', text: '#854d0e', label: '🟡 Low evidence' },
  GREEN:  { bg: '#dcfce7', text: '#166534', label: '🟢 Consistent' },
  GRAY:   { bg: '#f1f5f9', text: '#475569', label: '⚪ No data' },
};

function scoreColor(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#d97706';
  return '#dc2626';
}

function scoreGauge(label: string, score: number): string {
  const color = scoreColor(score);
  return `
    <div class="gauge">
      <div class="gauge-circle" style="border-color:${color}">
        <span class="gauge-value" style="color:${color}">${score}</span>
      </div>
      <div class="gauge-label">${label}</div>
    </div>`;
}

function flagRow(flag: Flag): string {
  const { bg, text, label } = FLAG_COLORS[flag.type];
  return `
    <tr style="background:${bg}">
      <td style="color:${text};font-weight:600;padding:8px 12px">${label}</td>
      <td style="padding:8px 12px;font-weight:500">${flag.skill}</td>
      <td style="padding:8px 12px">${flag.message}</td>
      <td style="padding:8px 12px;color:#64748b;font-size:0.85em">${flag.evidence}</td>
    </tr>`;
}

function metadataSection(result: AnalysisResult): string {
  const { metadata } = result;
  return `
    <div class="meta">
      <span>📦 ${metadata.totalRepos} repos</span>
      <span>🛠 ${metadata.skillsFound} skills detected</span>
      <span>✅ ${metadata.skillsVerified} verified</span>
      <span>🕐 ${new Date(metadata.analyzedAt).toLocaleString()}</span>
    </div>`;
}

export type ReportSource = 'cv' | 'portfolio' | 'both';

export function generateReport(result: AnalysisResult, source: ReportSource = 'cv'): string {
  const { scores, flags } = result;
  const sortedFlags = [...flags].sort((a, b) => {
    const order: FlagType[] = ['RED', 'YELLOW', 'GRAY', 'GREEN'];
    return order.indexOf(a.type) - order.indexOf(b.type);
  });

  const title = source === 'cv' ? 'CV ↔ GitHub Analysis'
    : source === 'portfolio' ? 'Portfolio ↔ GitHub Analysis'
    : 'CV + Portfolio ↔ GitHub Analysis';

  const srcLabel = source === 'cv' ? 'CV'
    : source === 'portfolio' ? 'Portfolio'
    : 'CV+Portfolio';

  const flagsHTML = sortedFlags.length > 0
    ? sortedFlags.map(flagRow).join('')
    : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#16a34a">✅ No inconsistencies found</td></tr>`;

  return `
<div class="report" style="font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:16px">
  <h2 style="margin:0 0 4px;font-size:1.2em">${title}</h2>
  <p style="margin:0 0 16px;color:#64748b;font-size:0.9em">@${result.metadata.githubUsername}</p>

  ${metadataSection(result)}

  <p style="margin:4px 0 12px;font-size:0.75em;color:#94a3b8;font-style:italic">
    Analysis based on public GitHub data. Absence of evidence is not evidence of absence.
  </p>

  <div class="gauges" style="display:flex;gap:16px;justify-content:center;margin:16px 0;flex-wrap:wrap">
    ${scoreGauge(srcLabel, scores.cv)}
    ${scoreGauge('GitHub', scores.github)}
    ${scoreGauge('Coherence', scores.coherence)}
    ${scoreGauge('Global', scores.global)}
  </div>

  <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;margin-top:16px">
    <thead>
      <tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;font-size:0.85em;color:#475569">Status</th>
        <th style="padding:8px 12px;text-align:left;font-size:0.85em;color:#475569">Skill</th>
        <th style="padding:8px 12px;text-align:left;font-size:0.85em;color:#475569">Finding</th>
        <th style="padding:8px 12px;text-align:left;font-size:0.85em;color:#475569">Evidence</th>
      </tr>
    </thead>
    <tbody>${flagsHTML}</tbody>
  </table>
</div>

<style>
  .report .gauge { text-align:center;min-width:80px }
  .report .gauge-circle {
    width:64px;height:64px;border-radius:50%;border:4px solid;
    display:flex;align-items:center;justify-content:center;margin:0 auto 4px
  }
  .report .gauge-value { font-size:1.2em;font-weight:700 }
  .report .gauge-label { font-size:0.75em;color:#64748b;font-weight:500 }
  .report .meta {
    display:flex;gap:12px;flex-wrap:wrap;padding:8px 12px;
    background:#f8fafc;border-radius:6px;font-size:0.8em;color:#475569
  }
</style>`;
}
