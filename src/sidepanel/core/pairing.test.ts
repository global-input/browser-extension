import { describe, expect, it } from 'vitest';
import { KEY_LENGTH, checkKeysDraft, defaultPairingName, newPairing, withDefaultKeys, withPairing } from './pairing';

const relay = { url: 'https://relay.example.com', apikey: 'api-1' };

describe('pairing', () => {
  it('makes two new keys of the full length, with the name and time', () => {
    let calls = 0;
    const random = (length: number) => `${++calls}`.padEnd(length, 'x');
    const pairing = newPairing(random, 1000, 'Global Input in Chrome');
    expect(pairing.securityGroup).toHaveLength(KEY_LENGTH);
    expect(pairing.codeKey).toHaveLength(KEY_LENGTH);
    expect(pairing.securityGroup).not.toBe(pairing.codeKey);
    expect(pairing).toMatchObject({ name: 'Global Input in Chrome', pairedAt: 1000 });
  });

  it('names the pairing after the browser', () => {
    expect(defaultPairingName('Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/128.0')).toBe('Global Input in Firefox');
    expect(defaultPairingName('Mozilla/5.0 AppleWebKit Chrome/130.0 Safari/537.36 Edg/130.0')).toBe('Global Input in Edge');
    expect(defaultPairingName('Mozilla/5.0 AppleWebKit Chrome/130.0 Safari/537.36')).toBe('Global Input in Chrome');
  });

  it('keeps the relay settings when the keys change or go back to the defaults', () => {
    const paired = withPairing({ relay, pairing: {} }, { securityGroup: 'g', codeKey: 'c' });
    expect(paired).toEqual({ relay, pairing: { securityGroup: 'g', codeKey: 'c' } });
    expect(withDefaultKeys(paired)).toEqual({ relay, pairing: {} });
  });
});

describe('keys typed in', () => {
  const draft = { securityGroup: '', codeKey: '', name: '' };

  it('keeps the keys given, tidied, with the name and time', () => {
    expect(checkKeysDraft({ securityGroup: ' g-1 ', codeKey: 'c-1', name: ' Work laptop ' }, 5)).toEqual({
      pairing: { securityGroup: 'g-1', codeKey: 'c-1', name: 'Work laptop', pairedAt: 5 },
    });
    expect(checkKeysDraft({ ...draft, codeKey: 'c-1' }, 5)).toEqual({ pairing: { codeKey: 'c-1', pairedAt: 5 } });
  });

  it('refuses no keys or keys it cannot use', () => {
    expect(checkKeysDraft(draft, 5)).toHaveProperty('error');
    expect(checkKeysDraft({ ...draft, securityGroup: 'has space' }, 5)).toHaveProperty('error');
  });
});
