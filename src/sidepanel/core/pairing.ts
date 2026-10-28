// Private pairing: new keys that only this computer and its paired phones share. Pure, so the
// random source, the clock and the browser name are passed in.
import { cleanKey, cleanName } from 'global-input-mobile';
import type { ConnectionRecord, PairingSettings } from 'global-input-mobile';

// 24 characters from 62 gives about 140 bits per key.
export const KEY_LENGTH = 24;

export type RandomString = (length: number) => string;

// The name the phone can show for this pairing, for example "Global Input in Firefox".
export const defaultPairingName = (userAgent: string): string =>
  `Global Input in ${/Firefox\//.test(userAgent) ? 'Firefox' : /Edg\//.test(userAgent) ? 'Edge' : 'Chrome'}`;

export const newPairing = (random: RandomString, now: number, name: string): PairingSettings => ({
  securityGroup: random(KEY_LENGTH),
  codeKey: random(KEY_LENGTH),
  name,
  pairedAt: now,
});

// Replaces the keys and keeps the relay settings.
export const withPairing = (record: ConnectionRecord, pairing: PairingSettings): ConnectionRecord => ({
  relay: record.relay,
  pairing,
});

// Back to the public default keys; the relay settings stay.
export const withDefaultKeys = (record: ConnectionRecord): ConnectionRecord => ({ relay: record.relay, pairing: {} });

export interface KeysDraft {
  securityGroup: string;
  codeKey: string;
  name: string;
}

export type KeysCheck = { pairing: PairingSettings } | { error: string };

// Keys typed in, to share keys made elsewhere. A blank key keeps the default for that key.
export const checkKeysDraft = (draft: KeysDraft, now: number): KeysCheck => {
  const securityGroup = draft.securityGroup.trim() ? cleanKey(draft.securityGroup) : undefined;
  const codeKey = draft.codeKey.trim() ? cleanKey(draft.codeKey) : undefined;
  if ((draft.securityGroup.trim() && !securityGroup) || (draft.codeKey.trim() && !codeKey)) {
    return { error: 'Keys can only contain letters, digits and symbols, without spaces.' };
  }
  if (!securityGroup && !codeKey) {
    return { error: 'Enter at least one key, or use the default keys instead.' };
  }
  const name = cleanName(draft.name);
  return { pairing: { ...(securityGroup && { securityGroup }), ...(codeKey && { codeKey }), ...(name && { name }), pairedAt: now } };
};
