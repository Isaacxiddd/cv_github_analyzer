import type { HistoryEntry } from '../types/index.js';
import { HISTORY_KEY } from '../types/index.js';

export async function getHistory(): Promise<HistoryEntry[]> {
  const { [HISTORY_KEY]: data } = await chrome.storage.local.get(HISTORY_KEY);
  return (data as HistoryEntry[]) ?? [];
}

export async function saveEntry(entry: HistoryEntry): Promise<void> {
  const history = await getHistory();
  history.unshift(entry);
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
}

export async function deleteEntry(id: string): Promise<void> {
  const history = await getHistory();
  await chrome.storage.local.set({
    [HISTORY_KEY]: history.filter(e => e.id !== id),
  });
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(HISTORY_KEY);
}
