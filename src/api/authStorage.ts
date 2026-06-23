export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
};

const key = 'greenroot.admin.auth';

export function getStoredAuth(): StoredAuth | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth) {
  window.localStorage.setItem(key, JSON.stringify(auth));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(key);
}
