import type { WidgetShow, WidgetHide } from '../types/index.js';

// ─── Styles ───────────────────────────────────────────────────────────────────

const WIDGET_STYLES = `
  .cvg-widget-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 2147483646;
    background: transparent;
  }
  .cvg-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 280px;
    z-index: 2147483647;
    background: #0f172a;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    font-family: system-ui, -apple-system, sans-serif;
    color: #f8fafc;
    overflow: hidden;
    transition: transform 0.2s ease, opacity 0.2s ease;
    user-select: none;
    cursor: move;
  }
  .cvg-widget-body {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cvg-widget-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .cvg-widget-user {
    font-size: 0.85em;
    font-weight: 600;
    color: #f8fafc;
  }
  .cvg-widget-score {
    font-size: 0.9em;
    font-weight: 700;
    color: #16a34a;
  }
  .cvg-widget-label {
    font-size: 0.7em;
    color: #94a3b8;
  }
  .cvg-widget-actions {
    display: flex;
    gap: 6px;
    margin-top: 4px;
  }
  .cvg-widget-btn {
    flex: 1;
    padding: 6px 10px;
    border: none;
    border-radius: 6px;
    font-size: 0.75em;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .cvg-widget-btn-expand {
    background: #4f46e5;
    color: #fff;
  }
  .cvg-widget-btn-expand:hover { background: #4338ca }
  .cvg-widget-btn-close {
    background: transparent;
    color: #94a3b8;
    border: 1px solid #334155;
  }
  .cvg-widget-btn-close:hover { background: #1e293b; color: #f8fafc }
`;

// ─── State ────────────────────────────────────────────────────────────────────

let widgetContainer: HTMLDivElement | null = null;
let offsetX = 0, offsetY = 0;
let isDragging = false;
let isWidgetVisible = false;

// ─── Inject styles ────────────────────────────────────────────────────────────

function injectStyles(): void {
  const existing = document.getElementById('cvg-widget-styles');
  if (existing) return;
  const style = document.createElement('style');
  style.id = 'cvg-widget-styles';
  style.textContent = WIDGET_STYLES;
  document.head.appendChild(style);
}

// ─── Create widget DOM ────────────────────────────────────────────────────────

function createWidget(user: string, score: number): HTMLDivElement {
  const container = document.createElement('div');

  const overlay = document.createElement('div');
  overlay.className = 'cvg-widget-overlay';
  overlay.addEventListener('click', closeWidget);

  const widget = document.createElement('div');
  widget.className = 'cvg-widget';

  widget.innerHTML = `
    <div class="cvg-widget-body">
      <div class="cvg-widget-row">
        <span class="cvg-widget-user">@${user}</span>
        <span class="cvg-widget-score">${score}%</span>
      </div>
      <div class="cvg-widget-row">
        <span class="cvg-widget-label">Coherence Score</span>
        <span class="cvg-widget-label">CV ↔ GitHub</span>
      </div>
      <div class="cvg-widget-actions">
        <button class="cvg-widget-btn cvg-widget-btn-expand" id="cvg-expand">↑ Expand</button>
        <button class="cvg-widget-btn cvg-widget-btn-close" id="cvg-close">✕</button>
      </div>
    </div>`;

  widget.querySelector('#cvg-expand')!.addEventListener('click', expandWidget);
  widget.querySelector('#cvg-close')!.addEventListener('click', closeWidget);
  makeDraggable(widget);

  container.appendChild(overlay);
  container.appendChild(widget);
  return container;
}

// ─── Dragging ─────────────────────────────────────────────────────────────────

function makeDraggable(el: HTMLElement): void {
  el.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging = false;
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    const onMove = (ev: MouseEvent) => {
      isDragging = true;
      el.style.left = `${Math.max(0, ev.clientX - offsetX)}px`;
      el.style.top = `${Math.max(0, ev.clientY - offsetY)}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ─── Show / Hide ──────────────────────────────────────────────────────────────

function showWidget(user: string, score: number): void {
  if (isWidgetVisible) closeWidget();
  isWidgetVisible = true;
  injectStyles();
  widgetContainer = createWidget(user, score);
  document.body.appendChild(widgetContainer);
}

function closeWidget(): void {
  if (widgetContainer) {
    widgetContainer.remove();
    widgetContainer = null;
  }
  isWidgetVisible = false;
}

function expandWidget(): void {
  closeWidget();
  chrome.runtime.sendMessage({ type: 'EXPAND_POPUP' }).catch(() => {});
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg: WidgetShow | WidgetHide) => {
  if (msg.type === 'WIDGET_SHOW') {
    showWidget(msg.entry.github_username, msg.entry.score_coherence);
  }
  if (msg.type === 'WIDGET_HIDE') {
    closeWidget();
  }
});
