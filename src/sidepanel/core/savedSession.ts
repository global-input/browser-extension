// The phone session kept while the panel is closed, so the phone that connected can come back
// from the app's History after the panel is opened again. It is kept in memory-only extension
// storage (cleared when the browser quits) and holds the session key, so nothing else may read it.
// Pure functions only; the storage itself is in adapters/sessionStore.
export interface SavedSession {
  v: 1;
  session: string;
  aes: string;
  client: string;
  // The relay node the session is registered on. The phone's History entry points there, so a
  // resumed session that lands on another node can no longer be joined.
  url: string;
  // The phone the session is bound to.
  phoneClient: string;
  // The connection settings (relay and pairing keys) the session was made with.
  settingsKey: string;
  lastConnectedAt: number;
}

export interface ConnectionSettingsLike {
  url?: string;
  apikey?: string;
  securityGroup?: string;
  codeKey?: string;
}

export const settingsKeyOf = (settings: ConnectionSettingsLike) =>
  JSON.stringify([settings.url || '', settings.apikey || '', settings.securityGroup || '', settings.codeKey || '']);

export interface SessionDataLike {
  session?: string;
  aes?: string;
  client?: string;
  url?: string;
  sender?: { client?: string } | null;
}

const filled = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

// The record to save for the current session, or null when it is not worth keeping (no phone
// has connected to it yet).
export const toSavedSession = (data: SessionDataLike | null, settingsKey: string, lastConnectedAt: number): SavedSession | null => {
  if (!data || !filled(data.session) || !filled(data.aes) || !filled(data.client) || !filled(data.url)) return null;
  const phoneClient = data.sender && data.sender.client;
  if (!filled(phoneClient)) return null;
  return { v: 1, session: data.session, aes: data.aes, client: data.client, url: data.url, phoneClient, settingsKey, lastConnectedAt };
};

// Anything unexpected reads as "no saved session".
export const parseSavedSession = (raw: unknown): SavedSession | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.v !== 1) return null;
  if (![r.session, r.aes, r.client, r.url, r.phoneClient, r.settingsKey].every(filled)) return null;
  if (typeof r.lastConnectedAt !== 'number' || !Number.isFinite(r.lastConnectedAt)) return null;
  return {
    v: 1,
    session: r.session as string,
    aes: r.aes as string,
    client: r.client as string,
    url: r.url as string,
    phoneClient: r.phoneClient as string,
    settingsKey: r.settingsKey as string,
    lastConnectedAt: r.lastConnectedAt,
  };
};

// The saved session to resume with the current settings, or null to start fresh.
export const sessionToResume = (saved: SavedSession | null, settingsKey: string) =>
  saved && saved.settingsKey === settingsKey ? saved : null;

// What global-input-react takes to resume (its config.session).
export const resumeConfigOf = (saved: SavedSession) => ({
  session: saved.session,
  aes: saved.aes,
  client: saved.client,
  sender: { client: saved.phoneClient },
});
