export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
};

const key = 'greenroot.admin.auth';

// Admin tokens live in sessionStorage: they end with the tab, are never
// shared with other tabs or kept on disk across browser restarts, and the API
// caps admin sessions at 12 hours anyway. (The CDN's Content-Security-Policy
// allows only the app's own scripts, which is what keeps them away from
// injected code.) Older builds kept them in localStorage: removed on sight.
function store(): Storage {
  return window.sessionStorage;
}

function dropLegacy() {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage blocked: nothing to drop */
  }
}

export function getStoredAuth(): StoredAuth | null {
  dropLegacy();
  let raw: string | null = null;
  try {
    raw = store().getItem(key);
  } catch {
    return null;
  }
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
  try {
    store().setItem(key, JSON.stringify(auth));
  } catch {
    /* storage blocked: the session lasts until reload */
  }
}

export function clearStoredAuth() {
  dropLegacy();
  try {
    store().removeItem(key);
  } catch {
    /* nothing stored */
  }
}
