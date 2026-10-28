// The stored connection settings: one versioned JSON record, read defensively. Anything
// missing, malformed or of an unknown version falls back to the defaults (an empty field
// means the default value), so a bad record can never stop the extension from connecting.
//
// relay:   where messages are routed (WebSocket server URL, API key). Not secret: the relay
//          only forwards end-to-end encrypted messages.
// pairing: the private keys shared with paired phones (Security Group Key, Code Key), plus the
//          name the phone can show for this pairing and when the keys were made.

export const RECORD_KEY = 'globalInput.connection';
export const RECORD_VERSION = 1;

export interface RelaySettings {
  url?: string;
  apikey?: string;
}

export interface PairingSettings {
  securityGroup?: string;
  codeKey?: string;
  name?: string;
  pairedAt?: number;
}

export interface ConnectionRecord {
  relay: RelaySettings;
  pairing: PairingSettings;
}

export const DEFAULT_RECORD: ConnectionRecord = { relay: {}, pairing: {} };

const MAX_KEY_LENGTH = 256;
const MAX_NAME_LENGTH = 64;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// A key or API key: printable, no spaces, not too long.
export const cleanKey = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const key = value.trim();
  return key && key.length <= MAX_KEY_LENGTH && /^[\x21-\x7E]+$/.test(key) ? key : undefined;
};

// An http(s) URL, without a trailing slash (the library appends its own paths).
export const cleanUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_KEY_LENGTH) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    return url.href.replace(/\/+$/, '');
  } catch (error) {
    return undefined;
  }
};

const cleanName = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const name = value.replace(/[\x00-\x1F\x7F]/g, '').trim();
  return name ? name.slice(0, MAX_NAME_LENGTH) : undefined;
};

const cleanTime = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;

const compact = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;

export const cleanRecord = (value: unknown): ConnectionRecord => {
  if (!isObject(value)) return DEFAULT_RECORD;
  const relay = isObject(value.relay) ? value.relay : {};
  const pairing = isObject(value.pairing) ? value.pairing : {};
  return {
    relay: compact({ url: cleanUrl(relay.url), apikey: cleanKey(relay.apikey) }),
    pairing: compact({
      securityGroup: cleanKey(pairing.securityGroup),
      codeKey: cleanKey(pairing.codeKey),
      name: cleanName(pairing.name),
      pairedAt: cleanTime(pairing.pairedAt),
    }),
  };
};

export const parseRecord = (raw: string | null): ConnectionRecord => {
  if (!raw) return DEFAULT_RECORD;
  try {
    const value = JSON.parse(raw);
    return isObject(value) && value.version === RECORD_VERSION ? cleanRecord(value) : DEFAULT_RECORD;
  } catch (error) {
    return DEFAULT_RECORD;
  }
};

export const serializeRecord = (record: ConnectionRecord): string =>
  JSON.stringify({ version: RECORD_VERSION, ...cleanRecord(record) });

// True when the extension uses its own keys instead of the public defaults.
export const isPrivatelyPaired = (record: ConnectionRecord): boolean =>
  !!(record.pairing.securityGroup || record.pairing.codeKey);
