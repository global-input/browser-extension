import { describe, expect, it } from 'vitest';
import { createMessageConnector } from 'global-input-react';
import { buildPairingCode } from './pairingCode';

// Decodes a code the way the Global Input App does when it scans one.
const decode = (code: string) => {
  let pairing: Record<string, unknown> | null = null;
  createMessageConnector().processCodeData(code, { onPairing: data => (pairing = data as Record<string, unknown>) });
  return pairing;
};

describe('pairing code', () => {
  it('carries the keys and the name, and nothing about the relay', () => {
    const code = buildPairingCode({ securityGroup: 'group-1', codeKey: 'code-1', name: 'Global Input in Chrome', pairedAt: 1 });
    expect(code.startsWith('C')).toBe(true);
    expect(decode(code)).toEqual({ securityGroup: 'group-1', codeAES: 'code-1', action: 'pairing', name: 'Global Input in Chrome' });
  });

  it('is not readable as a connection code', () => {
    let input = false;
    createMessageConnector().processCodeData(buildPairingCode({ securityGroup: 'g', codeKey: 'c' }), {
      onInputCodeData: () => (input = true),
      onError: () => undefined,
    });
    expect(input).toBe(false);
  });
});
