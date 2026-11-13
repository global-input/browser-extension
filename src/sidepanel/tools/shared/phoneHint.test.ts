import { describe, expect, it } from 'vitest';
import { phoneHint } from './phoneHint';

describe('phone hint', () => {
  it('asks to scan for a fresh session and to come back from History while waiting', () => {
    expect(phoneHint({})).toBe('Connect your phone in the Sign in tab');
    expect(phoneHint({ isDisconnected: true })).toBe("Reconnect your phone from the Global Input App's History");
  });
});
