import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_RECORD, RECORD_KEY, isPrivatelyPaired, parseRecord, serializeRecord } from './connectionRecord';
import {
  loadConnectionRecord, loadConnectionSettings, onConnectionRecordChange, saveConnectionRecord, saveConnectionSettings,
} from './storage';

const record = {
  relay: { url: 'https://relay.example.com', apikey: 'api-1' },
  pairing: { securityGroup: 'group-1', codeKey: 'code-1', name: 'Global Input in Chrome', pairedAt: 1761600000000 },
};

describe('connection record', () => {
  it('round-trips a valid record', () => {
    expect(parseRecord(serializeRecord(record))).toEqual(record);
  });

  it.each([
    ['nothing stored', null],
    ['not JSON', '{oops'],
    ['JSON null', 'null'],
    ['an array', '[1,2]'],
    ['a string', '"text"'],
    ['no version', JSON.stringify({ relay: record.relay, pairing: record.pairing })],
    ['an unknown version', JSON.stringify({ ...record, version: 99 })],
  ])('uses the defaults for %s', (_, raw) => {
    expect(parseRecord(raw)).toEqual(DEFAULT_RECORD);
  });

  it('drops each invalid value and keeps the valid ones', () => {
    const raw = JSON.stringify({
      version: 1,
      relay: { url: 'javascript:alert(1)', apikey: 'has space' },
      pairing: { securityGroup: 42, codeKey: ' code-2 ', name: '\u0007x'.repeat(50), pairedAt: -1, extra: true },
    });
    const parsed = parseRecord(raw);
    expect(parsed.relay).toEqual({});
    expect(parsed.pairing).toEqual({ codeKey: 'code-2', name: 'x'.repeat(50) });
  });

  it('uses empty groups when relay or pairing has the wrong shape', () => {
    expect(parseRecord(JSON.stringify({ version: 1, relay: 'x', pairing: [] }))).toEqual(DEFAULT_RECORD);
  });

  it('normalises the relay URL and limits the name', () => {
    const parsed = parseRecord(serializeRecord({
      relay: { url: ' http://10.0.0.5:1337/ ' },
      pairing: { name: 'n'.repeat(100) },
    }));
    expect(parsed.relay.url).toBe('http://10.0.0.5:1337');
    expect(parsed.pairing.name).toHaveLength(64);
  });

  it('is privately paired only with a key of its own', () => {
    expect(isPrivatelyPaired(DEFAULT_RECORD)).toBe(false);
    expect(isPrivatelyPaired({ relay: record.relay, pairing: { name: 'x' } })).toBe(false);
    expect(isPrivatelyPaired(record)).toBe(true);
  });
});

describe('connection settings storage', () => {
  beforeEach(() => localStorage.clear());

  it('loads the defaults when storage holds something unexpected', () => {
    localStorage.setItem(RECORD_KEY, '{"version":1,"relay":');
    expect(loadConnectionRecord()).toEqual(DEFAULT_RECORD);
    expect(loadConnectionSettings()).toEqual({});
  });

  it('loads the defaults when storage cannot be read', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadConnectionRecord()).toEqual(DEFAULT_RECORD);
    spy.mockRestore();
  });

  it('saves the record, removes the old separate keys and tells listeners', () => {
    localStorage.setItem('iterative.globalInputApp.codeKey', 'old');
    const listener = vi.fn();
    const stop = onConnectionRecordChange(listener);
    expect(saveConnectionRecord(record)).toBe(true);
    expect(loadConnectionRecord()).toEqual(record);
    expect(localStorage.getItem('iterative.globalInputApp.codeKey')).toBeNull();
    expect(listener).toHaveBeenCalledWith(record);
    stop();
    saveConnectionRecord(DEFAULT_RECORD);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reports whether the flat settings changed the keys, keeping the pairing name', () => {
    saveConnectionRecord(record);
    expect(saveConnectionSettings({ url: 'https://other.example.com', apikey: 'api-1', securityGroup: 'group-1', codeKey: 'code-1' })).toBe(false);
    expect(saveConnectionSettings({ securityGroup: 'group-2', codeKey: 'code-1' })).toBe(true);
    expect(loadConnectionRecord().pairing.name).toBe('Global Input in Chrome');
    expect(loadConnectionSettings()).toEqual({ securityGroup: 'group-2', codeKey: 'code-1' });
  });
});
