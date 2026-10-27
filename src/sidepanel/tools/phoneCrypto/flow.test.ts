import { describe, expect, it } from 'vitest';
import { cryptoReducer, initialCryptoState } from './flow';
import type { CryptoEvent, CryptoState } from './flow';

const run = (events: CryptoEvent[], state: CryptoState = initialCryptoState) => events.reduce(cryptoReducer, state);

describe('phone crypto flow', () => {
  it('refuses to start without content, and clears the error on the next edit', () => {
    const empty = run([{ type: 'edit', content: '   ' }, { type: 'start' }]);
    expect(empty).toMatchObject({ stage: 'input', error: 'empty' });
    expect(cryptoReducer(empty, { type: 'edit', content: 'x' })).toEqual({ stage: 'input', content: 'x', phone: 'computer', fromPage: undefined, error: undefined });
  });

  it('sends the trimmed content to the phone, and Back keeps it', () => {
    const processing = run([{ type: 'type-on-phone' }, { type: 'edit', content: ' secret ' }, { type: 'start' }]);
    expect(processing).toEqual({ stage: 'processing', content: 'secret', fromPage: undefined });
    expect(cryptoReducer(processing, { type: 'back' })).toEqual({ stage: 'input', content: 'secret', phone: 'computer', fromPage: undefined });
  });

  it('stays on the phone step when the phone sends an empty result', () => {
    const state = run([{ type: 'edit', content: 'a' }, { type: 'start' }, { type: 'received', result: '' }]);
    expect(state).toEqual({ stage: 'processing', content: 'a', fromPage: undefined, error: 'failed' });
  });

  it('shows the result, can show it on the phone, and restarts empty', () => {
    const result = run([{ type: 'edit', content: 'a' }, { type: 'start' }, { type: 'received', result: 'XYZ' }]);
    expect(result).toEqual({ stage: 'result', result: 'XYZ', phone: 'computer', fromPage: undefined });
    expect(cryptoReducer(result, { type: 'show-on-phone' })).toEqual({ stage: 'result', result: 'XYZ', phone: 'mobile', fromPage: undefined });
    expect(cryptoReducer(result, { type: 'restart' })).toBe(initialCryptoState);
  });

  it('remembers that the text came from the page, through to the result', () => {
    const fromPage = run([{ type: 'from-page', content: 'plain' }]);
    expect(fromPage).toMatchObject({ stage: 'input', content: 'plain', fromPage: true });
    expect(run([{ type: 'start' }, { type: 'back' }], fromPage)).toMatchObject({ stage: 'input', content: 'plain', fromPage: true });
    expect(run([{ type: 'start' }, { type: 'received', result: 'XYZ' }], fromPage)).toMatchObject({ stage: 'result', fromPage: true });
    expect(cryptoReducer(fromPage, { type: 'edit', content: '' })).toMatchObject({ content: '', fromPage: false });
  });

  it('ignores events that do not belong to the stage', () => {
    expect(cryptoReducer(initialCryptoState, { type: 'received', result: 'x' })).toBe(initialCryptoState);
  });
});
