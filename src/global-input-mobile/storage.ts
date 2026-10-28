// Connection settings in the extension's localStorage, as one record (see connectionRecord.ts).
// Every extension page (side panel, popup) reads the same record, so all connections use the
// same relay and keys. Storage errors fall back to the defaults.
import { DEFAULT_RECORD, RECORD_KEY, parseRecord, serializeRecord } from './connectionRecord';
import type { ConnectionRecord } from './connectionRecord';

// The four values a connection needs, flat, as useMobile and the popup's settings editor use them.
export interface ConnectionSettings {
  url?: string;
  apikey?: string;
  securityGroup?: string;
  codeKey?: string;
}

// The separate keys used before the record; removed on the first save.
const LEGACY_KEYS = ['url', 'apikey', 'securityGroup', 'codeKey'].map(name => `iterative.globalInputApp.${name}`);

type Listener = (record: ConnectionRecord) => void;
const listeners = new Set<Listener>();

export const loadConnectionRecord = (): ConnectionRecord => {
  try {
    return parseRecord(localStorage.getItem(RECORD_KEY));
  } catch (error) {
    return DEFAULT_RECORD;
  }
};

export const saveConnectionRecord = (record: ConnectionRecord): boolean => {
  try {
    localStorage.setItem(RECORD_KEY, serializeRecord(record));
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    return false;
  }
  const saved = loadConnectionRecord();
  listeners.forEach(listener => listener(saved));
  return true;
};

// Called when the record changes in this page or in another extension page.
export const onConnectionRecordChange = (listener: Listener): (() => void) => {
  const fromOtherPage = (event: StorageEvent) => {
    if (event.key === RECORD_KEY || event.key === null) listener(loadConnectionRecord());
  };
  listeners.add(listener);
  window.addEventListener('storage', fromOtherPage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', fromOtherPage);
  };
};

export const loadConnectionSettings = (): ConnectionSettings => {
  const { relay, pairing } = loadConnectionRecord();
  return { url: relay.url, apikey: relay.apikey, securityGroup: pairing.securityGroup, codeKey: pairing.codeKey };
};

// Returns true when the keys changed, so phones need to pair again.
export const saveConnectionSettings = (settings: ConnectionSettings): boolean => {
  const current = loadConnectionRecord();
  const pairing = { ...current.pairing, securityGroup: settings.securityGroup, codeKey: settings.codeKey };
  saveConnectionRecord({ relay: { url: settings.url, apikey: settings.apikey }, pairing });
  const saved = loadConnectionRecord().pairing;
  return saved.securityGroup !== current.pairing.securityGroup || saved.codeKey !== current.pairing.codeKey;
};
