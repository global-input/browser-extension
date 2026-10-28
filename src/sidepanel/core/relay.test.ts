import { describe, expect, it } from 'vitest';
import { checkRelayDraft, describeRelay, relayDraftOf, sameRelay } from './relay';

describe('relay server settings', () => {
  it('treats blank fields as the defaults', () => {
    expect(checkRelayDraft({ url: '  ', apikey: '' })).toEqual({ relay: {} });
  });

  it('accepts a server address and API key, tidied', () => {
    expect(checkRelayDraft({ url: ' https://relay.example.com/ ', apikey: ' key-1 ' })).toEqual({
      relay: { url: 'https://relay.example.com', apikey: 'key-1' },
    });
  });

  it('explains an address or API key it cannot use', () => {
    expect(checkRelayDraft({ url: 'relay.example.com', apikey: '' })).toHaveProperty('error');
    expect(checkRelayDraft({ url: 'ftp://relay.example.com', apikey: '' })).toHaveProperty('error');
    expect(checkRelayDraft({ url: '', apikey: 'has space' })).toHaveProperty('error');
  });

  it('compares and describes the settings', () => {
    expect(relayDraftOf({})).toEqual({ url: '', apikey: '' });
    expect(sameRelay({}, { url: '', apikey: '' })).toBe(true);
    expect(sameRelay({ url: 'https://a.example' }, {})).toBe(false);
    expect(describeRelay({})).toBe('Default server');
    expect(describeRelay({ apikey: 'k' })).toBe('Default server, own API key');
    expect(describeRelay({ url: 'http://10.0.0.5:1337' })).toBe('Own server: 10.0.0.5:1337');
  });
});
