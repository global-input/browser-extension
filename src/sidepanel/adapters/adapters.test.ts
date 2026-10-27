import { beforeEach, describe, expect, it } from 'vitest';
import { siteSettingsStore } from './siteSettings';
import { pageRulesPort } from './rules';

beforeEach(() => localStorage.clear());

describe('site settings', () => {
  it('returns the defaults for an unknown site and stores only sites that differ', () => {
    expect(siteSettingsStore.get('a.example')).toEqual({ autoSubmit: false, detect: true });
    siteSettingsStore.set('a.example', { autoSubmit: true, detect: true });
    siteSettingsStore.set('b.example', { autoSubmit: false, detect: false });
    expect(siteSettingsStore.get('a.example').autoSubmit).toBe(true);
    expect(siteSettingsStore.list().map(site => site.host)).toEqual(['a.example', 'b.example']);
    siteSettingsStore.set('a.example', { autoSubmit: false, detect: true });
    expect(siteSettingsStore.list().map(site => site.host)).toEqual(['b.example']);
  });
});

describe('saving page rules', () => {
  const usernameForm = { title: 'step 1', fields: [{ id: 'username', type: 'text', selector: '#u' }] };
  const passwordForm = { title: 'step 2', fields: [{ id: 'password', type: 'secret', selector: '#p' }] };

  it('stores {forms} for the host, adds forms of later steps, and skips duplicates', () => {
    pageRulesPort.save('sso.example', { forms: [usernameForm] });
    pageRulesPort.save('sso.example', { forms: [passwordForm] });
    pageRulesPort.save('sso.example', { forms: [usernameForm] });
    const saved = JSON.parse(localStorage.getItem('extension.control.sso.example')!);
    expect(saved).toEqual({ forms: [usernameForm, passwordForm] });
    expect(pageRulesPort.find('sso.example')).toEqual(saved);
  });
});
