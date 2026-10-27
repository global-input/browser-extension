import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignInAgent } from './signInAgent';
import { detectSignInRule, detectUsernameStepRule, signInStepOf } from './autoDetect';
import { handleLegacyMessage } from './legacyProtocol';
import { SIGN_IN_MESSAGE } from '../shared/signInMessages';

// jsdom does no layout, so every element would count as invisible.
const showEverything = () => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const hidden = (this as HTMLElement).hidden || (this as HTMLElement).style.display === 'none';
    return { width: hidden ? 0 : 100, height: hidden ? 0 : 20 } as DOMRect;
  });
};

const SIGN_IN_HTML = `
  <form action="/session" method="post">
    <label for="email">Email</label><input id="email" type="email">
    <input name="pw" type="password" placeholder="Password">
    <input type="hidden" name="token" value="x">
    <button type="submit">Log in</button>
  </form>`;

beforeEach(() => {
  vi.restoreAllMocks();
  showEverything();
  document.body.innerHTML = SIGN_IN_HTML;
});

describe('auto-detection', () => {
  it('builds a rule from the email field, the password field and the submit button', () => {
    const rule = detectSignInRule(document)!;
    expect(rule.forms[0].fields).toEqual([
      { id: 'username', type: 'text', selector: '#email', data: { label: 'Email' } },
      { id: 'password', type: 'secret', selector: 'input[name="pw"]', data: { label: 'Password' } },
      expect.objectContaining({ id: 'login', type: 'button', data: { label: 'Log in' } }),
    ]);
  });

  it('finds nothing when there is no visible password field, or more than one', () => {
    (document.querySelector('input[type="password"]') as HTMLElement).hidden = true;
    expect(detectSignInRule(document)).toBeNull();
    document.body.innerHTML = SIGN_IN_HTML + '<input type="password">';
    expect(detectSignInRule(document)).toBeNull();
  });
});

describe('sign-in agent', () => {
  it('reports the page state, then a change when the form goes away', async () => {
    vi.useFakeTimers();
    const send = vi.fn();
    const agent = createSignInAgent({ send });
    agent.start();
    expect(send).toHaveBeenLastCalledWith({
      messageType: SIGN_IN_MESSAGE.PAGE_STATE,
      content: expect.objectContaining({ hasSignInForm: true }),
    });
    document.body.innerHTML = '<h1>Dashboard</h1>';
    await vi.advanceTimersByTimeAsync(500);
    expect(send).toHaveBeenLastCalledWith({
      messageType: SIGN_IN_MESSAGE.PAGE_STATE,
      content: expect.objectContaining({ hasSignInForm: false }),
    });
    vi.useRealTimers();
  });

  it('detects with auto-detection when no rule fits, and fills with native events', () => {
    const agent = createSignInAgent({ send: vi.fn() });
    const reply = agent.detect({ rule: { forms: [{ fields: [{ id: 'x', selector: '#missing' }] }] } });
    expect(reply).toMatchObject({ status: 'success', ruleSource: 'auto', host: window.location.host });
    expect(reply.form!.id).toBe(`###username###@${window.location.host}`);

    const email = document.getElementById('email') as HTMLInputElement;
    const onInput = vi.fn();
    email.addEventListener('input', onInput);
    expect(agent.fill({ fieldId: 'username', value: 'you@company.com', expectedHost: window.location.host })).toEqual({
      status: 'success',
      pressed: false,
    });
    expect(email.value).toBe('you@company.com');
    expect(onInput).toHaveBeenCalled();
  });

  it('uses the page rule when it matches', () => {
    const agent = createSignInAgent({ send: vi.fn() });
    const reply = agent.detect({
      rule: { forms: [{ title: 'Custom', fields: [{ id: 'user', type: 'text', selector: '#email', data: { label: 'User' } }] }] },
    });
    expect(reply).toMatchObject({ status: 'success', ruleSource: 'rule' });
    expect(reply.form!.title).toBe('Custom');
  });

  it('refuses to fill when the page is on another host than the panel expects', () => {
    const agent = createSignInAgent({ send: vi.fn() });
    agent.detect({ rule: null });
    expect(agent.fill({ fieldId: 'password', value: 'secret', expectedHost: 'evil.example' })).toEqual({
      status: 'error',
      reason: 'host-mismatch',
    });
    expect((document.querySelector('input[type="password"]') as HTMLInputElement).value).toBe('');
  });

  it('presses the submit button and says so', () => {
    const agent = createSignInAgent({ send: vi.fn() });
    agent.detect({ rule: null });
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    document.querySelector('form')!.addEventListener('submit', onSubmit);
    expect(agent.fill({ fieldId: 'login', value: null, expectedHost: window.location.host })).toEqual({ status: 'success', pressed: true });
    expect(onSubmit).toHaveBeenCalled();
  });
});

describe('popup page-control messages (unchanged behaviour)', () => {
  const rule = { forms: [{ fields: [{ id: 'username', type: 'text', selector: '#email', data: { label: 'Email' } }] }] };

  it('answers get-page-config and set-form-field as before', () => {
    const reply = vi.fn();
    handleLegacyMessage({ messageType: 'get-page-config', content: { applicationControlConfig: rule } }, reply);
    expect(reply).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', content: expect.objectContaining({ form: expect.objectContaining({ id: expect.stringContaining('###username###@') }) }) })
    );
    handleLegacyMessage({ messageType: 'set-form-field', content: { fieldId: 'username', fieldValue: 'a@b.c' } }, reply);
    expect((document.getElementById('email') as HTMLInputElement).value).toBe('a@b.c');
  });

  it('keeps the cache key for the popup', () => {
    const reply = vi.fn();
    handleLegacyMessage({ messageType: 'set-key', content: { key: 'k1' } }, reply);
    handleLegacyMessage({ messageType: 'check-page-status' }, reply);
    expect(reply).toHaveBeenLastCalledWith(expect.objectContaining({ content: { key: 'k1' } }));
  });
});

describe('two-step sign-in detection', () => {
  const withTitle = (title: string, html: string) => {
    document.title = title;
    document.body.innerHTML = html;
  };

  it('finds a username step with a hidden password field in the form (Google-style)', () => {
    withTitle('Example', `<form><input id="identifier" type="email" aria-label="Email or phone">
      <input type="password" name="hiddenPassword" hidden><button type="button">Next</button></form>`);
    const rule = detectUsernameStepRule(document)!;
    expect(rule.forms[0].fields.map(f => f.id)).toEqual(['username', 'login']);
    expect(rule.forms[0].fields[1].data).toEqual({ label: 'Next' });
    expect(signInStepOf(document)).toBe('username');
  });

  it('finds a username step from autocomplete="username", or sign-in wording', () => {
    withTitle('Portal', '<form><input name="loginfmt" autocomplete="username"><input type="submit" value="Next"></form>');
    expect(detectUsernameStepRule(document)).not.toBeNull();
    withTitle('Sign in to Example', '<form><input name="user"><button>Continue</button></form>');
    expect(detectUsernameStepRule(document)).not.toBeNull();
  });

  it('ignores a newsletter box, a search box, and forms with several text fields', () => {
    withTitle('Our shop', '<h1>Spring sale</h1><form><input type="email" name="email" placeholder="Your email"><button>Subscribe</button></form>');
    expect(detectUsernameStepRule(document)).toBeNull();
    withTitle('About the author', '<h2>Author notes</h2><form><input type="email" name="email"><button>Join</button></form>');
    expect(detectUsernameStepRule(document)).toBeNull();
    withTitle('Sign in', '<form role="search"><input type="text" name="user-search"><button>Search</button></form>');
    expect(detectUsernameStepRule(document)).toBeNull();
    withTitle('Sign in', '<form><input name="email"><input name="name"><button>Sign in</button></form>');
    expect(detectUsernameStepRule(document)).toBeNull();
  });

  it('reads a password-only page (the second step) without a username field', () => {
    withTitle('Sign in', '<form><p>you@company.com</p><input type="password" id="pw"><button>Sign in</button></form>');
    expect(detectSignInRule(document)!.forms[0].fields.map(f => f.id)).toEqual(['password', 'login']);
    expect(signInStepOf(document)).toBe('password');
  });

  it('reports the change from the username step to the password step in the same page', async () => {
    vi.useFakeTimers();
    withTitle('Sign in', '<form><input id="u" type="email"><input id="p" type="password" hidden><button>Next</button></form>');
    const send = vi.fn();
    const agent = createSignInAgent({ send });
    agent.start();
    expect(send).toHaveBeenLastCalledWith({ messageType: SIGN_IN_MESSAGE.PAGE_STATE, content: expect.objectContaining({ step: 'username' }) });
    (document.getElementById('u') as HTMLElement).hidden = true;
    (document.getElementById('p') as HTMLElement).hidden = false;
    await vi.advanceTimersByTimeAsync(500);
    expect(send).toHaveBeenLastCalledWith({ messageType: SIGN_IN_MESSAGE.PAGE_STATE, content: expect.objectContaining({ step: 'password' }) });
    const reply = agent.detect({ rule: null });
    expect(reply).toMatchObject({ status: 'success', step: 'password' });
    vi.useRealTimers();
  });
});

describe('saved rules with one form per step', () => {
  it('uses the password form on the password page even though the username field is still in the page', () => {
    document.body.innerHTML = '<form><input id="u" type="email" hidden><input id="p" type="password"><button>Sign in</button></form>';
    const agent = createSignInAgent({ send: vi.fn() });
    const reply = agent.detect({
      rule: {
        forms: [
          { title: 'step 1', fields: [{ id: 'username', type: 'text', selector: '#u' }] },
          { title: 'step 2', fields: [{ id: 'password', type: 'secret', selector: '#p' }] },
        ],
      },
    });
    expect(reply).toMatchObject({ status: 'success', ruleSource: 'rule', step: 'password' });
    expect(reply.form!.title).toBe('step 2');
    expect(reply.rule).toBeUndefined();
  });

  it('returns the auto-detected rule so the panel can save it', () => {
    const agent = createSignInAgent({ send: vi.fn() });
    const reply = agent.detect({ rule: null });
    expect(reply.ruleSource).toBe('auto');
    expect(reply.rule!.forms[0].fields.map(field => field.id)).toEqual(['username', 'password', 'login']);
  });
});
