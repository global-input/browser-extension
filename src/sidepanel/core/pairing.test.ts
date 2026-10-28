import { describe, expect, it } from 'vitest';
import { KEY_LENGTH, defaultPairingName, newPairing, withDefaultKeys, withPairing } from './pairing';

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
