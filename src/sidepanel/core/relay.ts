// The relay server fields of Settings → Advanced. Blank means the default server or API key.
import { cleanKey, cleanUrl } from 'global-input-mobile';
import type { RelaySettings } from 'global-input-mobile';

export interface RelayDraft {
  url: string;
  apikey: string;
}

export type RelayCheck = { relay: RelaySettings } | { error: string };

export const relayDraftOf = (relay: RelaySettings): RelayDraft => ({ url: relay.url ?? '', apikey: relay.apikey ?? '' });

export const checkRelayDraft = (draft: RelayDraft): RelayCheck => {
  const url = draft.url.trim() ? cleanUrl(draft.url) : undefined;
  if (draft.url.trim() && !url) {
    return { error: 'Enter the full server address, starting with https:// (or http:// inside a closed network).' };
  }
  const apikey = draft.apikey.trim() ? cleanKey(draft.apikey) : undefined;
  if (draft.apikey.trim() && !apikey) {
    return { error: 'The API key can only contain letters, digits and symbols, without spaces.' };
  }
  return { relay: { ...(url && { url }), ...(apikey && { apikey }) } };
};

export const sameRelay = (a: RelaySettings, b: RelaySettings) => (a.url ?? '') === (b.url ?? '') && (a.apikey ?? '') === (b.apikey ?? '');

export const describeRelay = (relay: RelaySettings): string =>
  relay.url ? `Own server: ${new URL(relay.url).host}` : relay.apikey ? 'Default server, own API key' : 'Default server';
