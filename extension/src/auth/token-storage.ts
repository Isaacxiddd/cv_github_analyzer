const STORAGE_KEY = 'githubToken';

export async function getStoredToken(): Promise<string | undefined> {
  const { [STORAGE_KEY]: token } = await chrome.storage.local.get(STORAGE_KEY);
  return (token as string) || undefined;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: token });
}

export async function removeToken(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
