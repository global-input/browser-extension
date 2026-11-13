import { describe, expect, it } from 'vitest';
import { parseSavedSession, resumeConfigOf, sessionToResume, settingsKeyOf, toSavedSession } from './savedSession';

const data = { session: 's1', aes: 'k1', client: 'c1', url: 'https://node1.example', sender: { client: 'phone1' } };
const key = settingsKeyOf({ url: 'https://globalinput.co.uk', apikey: 'a', securityGroup: 'g', codeKey: 'c' });

describe('saved session', () => {
  it('is made only once a phone has connected', () => {
    expect(toSavedSession({ ...data, sender: null }, key, 1)).toBeNull();
    expect(toSavedSession(null, key, 1)).toBeNull();
    expect(toSavedSession({ ...data, url: '' }, key, 1)).toBeNull();
    expect(toSavedSession(data, key, 5)).toEqual({
      v: 1, session: 's1', aes: 'k1', client: 'c1', url: 'https://node1.example', phoneClient: 'phone1', settingsKey: key, lastConnectedAt: 5,
    });
  });

  it('reads back what was saved and treats anything else as nothing saved', () => {
    const saved = toSavedSession(data, key, 5);
    expect(parseSavedSession(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
    expect(parseSavedSession(undefined)).toBeNull();
    expect(parseSavedSession('text')).toBeNull();
    expect(parseSavedSession({ ...saved, v: 2 })).toBeNull();
    expect(parseSavedSession({ ...saved, aes: '' })).toBeNull();
    expect(parseSavedSession({ ...saved, phoneClient: 7 })).toBeNull();
    expect(parseSavedSession({ ...saved, lastConnectedAt: 'x' })).toBeNull();
  });

  it('is resumed only with the settings it was made with', () => {
    const saved = toSavedSession(data, key, 5);
    expect(sessionToResume(saved, key)).toBe(saved);
    expect(sessionToResume(saved, settingsKeyOf({ url: 'https://other.example' }))).toBeNull();
    expect(sessionToResume(null, key)).toBeNull();
  });

  it('gives global-input-react the session, the key and the phone it is bound to', () => {
    const saved = toSavedSession(data, key, 5)!;
    expect(resumeConfigOf(saved)).toEqual({ session: 's1', aes: 'k1', client: 'c1', sender: { client: 'phone1' } });
  });
});
