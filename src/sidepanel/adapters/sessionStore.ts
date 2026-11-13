// Keeps the phone session while the panel is closed, in chrome.storage.session: memory only,
// cleared when the browser quits, and readable by extension pages only (not content scripts).
// Chrome has one side panel per window, so only one panel may own the saved session: the one
// that holds the Web Lock. Another panel starts its own session and does not save it.
import { loadConnectionSettings } from 'global-input-mobile';
import { parseSavedSession, sessionToResume, settingsKeyOf } from '../core/savedSession';
import type { SavedSession } from '../core/savedSession';

const KEY = 'phoneSession';
const LOCK = 'global-input-panel-session';

export interface SessionStore {
  // This panel owns the saved session (it may resume and save it).
  owner: boolean;
  // The session to resume, or null to start fresh.
  resume: SavedSession | null;
  settingsKey: () => string;
  save: (saved: SavedSession) => void;
  clear: () => void;
}

const area = (): chrome.storage.StorageArea | null => {
  try {
    return (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) || null;
  } catch (error) {
    return null;
  }
};

// Resolves true when this page got the lock; the lock is then held until the page closes.
const acquireLock = (): Promise<boolean> => {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks) return Promise.resolve(true);
  return new Promise(resolve => {
    locks
      .request(LOCK, { ifAvailable: true }, lock => {
        resolve(!!lock);
        return lock ? new Promise<void>(() => undefined) : undefined;
      })
      .catch(() => resolve(false));
  });
};

const readSaved = async (storage: chrome.storage.StorageArea): Promise<SavedSession | null> => {
  try {
    const items = await storage.get(KEY);
    return parseSavedSession(items && items[KEY]);
  } catch (error) {
    return null;
  }
};

// Used when there is no storage, another panel owns the session, or anything fails.
export const notOwned = (): SessionStore => ({
  owner: false,
  resume: null,
  settingsKey: () => settingsKeyOf(loadConnectionSettings()),
  save: () => undefined,
  clear: () => undefined,
});

export const openSessionStore = async (): Promise<SessionStore> => {
  const storage = area();
  if (!storage || !(await acquireLock())) return notOwned();
  const settingsKey = () => settingsKeyOf(loadConnectionSettings());
  const clear = () => {
    storage.remove(KEY).catch(() => undefined);
  };
  const saved = await readSaved(storage);
  const resume = sessionToResume(saved, settingsKey());
  if (saved && !resume) clear();
  return {
    owner: true,
    resume,
    settingsKey,
    save: record => {
      storage.set({ [KEY]: record }).catch(() => undefined);
    },
    clear,
  };
};
