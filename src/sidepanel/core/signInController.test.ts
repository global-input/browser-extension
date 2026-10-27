import { describe, expect, it, vi } from 'vitest';
import { AUTO_SUBMIT_DELAY_MS, PASSWORD_STEP_NOTICE, REJECTED_NOTICE, SPA_FAILURE_MS, SignInController, USERNAME_STEP_NOTICE } from './signInController';
import type { Ports, SignInView } from './signInController';
import { PHONE_FIELD } from './phoneForms';
import type { PageState } from '../../shared/signInMessages';

const FORM = {
  id: '###username###@tools.example.com',
  title: 'tools.example.com Sign In',
  fields: [
    { id: 'username', type: 'text', label: 'Email' },
    { id: 'password', type: 'secret', label: 'Password' },
    { id: 'login', type: 'button', label: 'Sign in' },
  ],
};

const AUTO_RULE = { forms: [{ title: 'auto', fields: [{ id: 'password', type: 'secret', selector: '#pw' }] }] };

const setup = () => {
  let now = 1000;
  const timers: { callback: () => void; ms: number; cancelled: boolean }[] = [];
  const page: Record<number, PageState | null> = {};
  const ports = {
    phone: { show: vi.fn(), disconnect: vi.fn() },
    page: {
      queryState: vi.fn(async (tabId: number) => page[tabId] ?? null),
      detect: vi.fn(async (tabId: number) => {
        const state = page[tabId];
        return state
          ? { status: 'success' as const, pageId: state.pageId, host: state.host, form: FORM, ruleSource: 'auto' as const, step: state.step ?? ('password' as const), rule: AUTO_RULE }
          : null;
      }),
      fill: vi.fn(async (_tabId: number, fieldId: string) => ({ status: 'success' as const, pressed: fieldId === 'login' })),
    },
    rules: { find: vi.fn(() => null), save: vi.fn() },
    sites: { get: vi.fn((_host: string) => ({ autoSubmit: false, detect: true })) },
    tools: { list: () => [{ id: 'encryption', label: 'Encrypt' }], open: vi.fn() },
    now: () => now,
    setTimer: (callback: () => void, ms: number) => {
      const timer = { callback, ms, cancelled: false };
      timers.push(timer);
      return () => {
        timer.cancelled = true;
      };
    },
  } satisfies Ports;
  const views: SignInView[] = [];
  const controller = new SignInController(ports, view => views.push(view));
  const lastScreen = () => ports.phone.show.mock.calls[ports.phone.show.mock.calls.length - 1][0];
  return {
    controller,
    ports,
    page,
    timers,
    lastScreen,
    view: () => controller.getView(),
    advance: (ms: number) => {
      now += ms;
    },
  };
};

const signInPage = (pageId = 'p1'): PageState => ({ pageId, host: 'tools.example.com', hasSignInForm: true, step: 'password' });
const usernamePage = (pageId = 'u1'): PageState => ({ pageId, host: 'tools.example.com', hasSignInForm: true, step: 'username' });
const dashboard = (pageId = 'p2'): PageState => ({ pageId, host: 'tools.example.com', hasSignInForm: false, step: null });

describe('SignInController', () => {
  it('shows the QR state until a phone connects, then asks the phone for the form on the active tab', async () => {
    const t = setup();
    t.page[1] = signInPage();
    await t.controller.activeTabChanged(1);
    expect(t.view().phase).toBe('not-connected');
    expect(t.ports.page.detect).not.toHaveBeenCalled();

    t.controller.phoneConnected();
    await vi.waitFor(() => expect(t.view().phase).toBe('requesting'));
    expect(t.view().host).toBe('tools.example.com');
    expect(t.lastScreen().form.id).toBe(FORM.id);
    expect(t.lastScreen().form.fields.map((f: { id: string }) => f.id)).toEqual(['username', 'password', 'login', PHONE_FIELD.SKIP]);
  });

  it('looks up the page rule for the host and passes it to the page', async () => {
    const t = setup();
    const rule = { forms: [{ fields: [] }] };
    t.ports.rules.find.mockReturnValue(rule as never);
    t.page[1] = signInPage();
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    expect(t.ports.rules.find).toHaveBeenCalledWith('tools.example.com');
    expect(t.ports.page.detect).toHaveBeenCalledWith(1, rule);
  });

  it('fills fields with the expected host, then reports signed in when the next page has no form', async () => {
    const t = setup();
    t.page[1] = signInPage();
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);

    await t.controller.phoneInput('username', 'you@company.com');
    await t.controller.phoneInput('password', 'secret');
    expect(t.ports.page.fill).toHaveBeenCalledWith(1, 'password', 'secret', 'tools.example.com');
    expect(t.view().filledFieldIds).toEqual(['username', 'password']);

    await t.controller.phoneInput('login', null);
    expect(t.view().phase).toBe('submitted');

    t.advance(3400);
    await t.controller.pageStateReceived(1, dashboard());
    expect(t.view().phase).toBe('signed-in');
    expect(t.view().signedInMs).toBe(3400);
    expect(t.view().recent[0].host).toBe('tools.example.com');
    expect(t.lastScreen().form.title).toBe('Signed in');
    expect(t.timers[0].cancelled).toBe(true);
  });

  it('never keeps the values the phone sends', async () => {
    const t = setup();
    t.page[1] = signInPage();
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    await t.controller.phoneInput('password', 'secret-value');
    expect(JSON.stringify(t.view())).not.toContain('secret-value');
  });

  it('asks again with a notice when the form comes back on a new page (wrong password)', async () => {
    const t = setup();
    t.page[1] = signInPage('p1');
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    await t.controller.phoneInput('login', null);

    t.page[1] = signInPage('p2');
    await t.controller.pageStateReceived(1, signInPage('p2'));
    expect(t.view().phase).toBe('requesting');
    expect(t.view().notice).toBe(REJECTED_NOTICE);
    expect(t.lastScreen().form.fields[0].value).toBe(REJECTED_NOTICE);
  });

  it('treats a single-page app still showing its form after the timeout as rejected', async () => {
    const t = setup();
    t.page[1] = signInPage('p1');
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    await t.controller.phoneInput('login', null);

    expect(t.timers[0].ms).toBe(SPA_FAILURE_MS);
    t.timers[0].callback();
    await vi.waitFor(() => expect(t.view().notice).toBe(REJECTED_NOTICE));
    expect(t.view().phase).toBe('requesting');
  });

  it('stops and fills nothing more when the page moved to another site', async () => {
    const t = setup();
    t.page[1] = signInPage();
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    t.ports.page.fill.mockResolvedValueOnce({ status: 'error', reason: 'host-mismatch' } as never);

    await t.controller.phoneInput('password', 'secret');
    expect(t.view().phase).toBe('ready');
    expect(t.view().notice).toMatch(/another site/);
    await t.controller.phoneInput('password', 'secret');
    expect(t.ports.page.fill).toHaveBeenCalledTimes(1);
  });

  it('does not ask again for a page the user skipped, but does for the next page', async () => {
    const t = setup();
    t.page[1] = signInPage('p1');
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    await t.controller.phoneInput(PHONE_FIELD.SKIP, null);
    expect(t.view().phase).toBe('skipped');
    expect(t.lastScreen().id).toBe('gi-panel-home');

    await t.controller.pageStateReceived(1, signInPage('p1'));
    expect(t.ports.page.detect).toHaveBeenCalledTimes(1);

    await t.controller.pageStateReceived(1, signInPage('p3'));
    expect(t.ports.page.detect).toHaveBeenCalledTimes(2);
  });

  it('ignores page reports from tabs that are not active', async () => {
    const t = setup();
    t.page[1] = dashboard();
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    await t.controller.pageStateReceived(2, signInPage());
    expect(t.ports.page.detect).not.toHaveBeenCalled();
  });

  it('switching tabs drops the request for the old tab', async () => {
    const t = setup();
    t.page[1] = signInPage();
    t.page[2] = dashboard();
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    await t.controller.activeTabChanged(2);
    expect(t.view().phase).toBe('ready');
    expect(t.lastScreen().id).toBe('gi-panel-home');
    await t.controller.phoneInput('password', 'secret');
    expect(t.ports.page.fill).not.toHaveBeenCalled();
  });

  it('reports a tab without the content script as unavailable', async () => {
    const t = setup();
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(5);
    expect(t.view().phase).toBe('unavailable');
  });

  it('reports a password page whose form cannot be read', async () => {
    const t = setup();
    t.page[1] = signInPage();
    t.ports.page.detect.mockResolvedValueOnce({ status: 'failed', pageId: 'p1', host: 'tools.example.com' } as never);
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    expect(t.view().phase).toBe('no-form');
  });

  it('passes Disconnect on the phone to the connection, and resets on disconnect', async () => {
    const t = setup();
    t.page[1] = signInPage();
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    await t.controller.phoneInput(PHONE_FIELD.DISCONNECT, null);
    expect(t.ports.phone.disconnect).toHaveBeenCalled();
    t.controller.phoneDisconnected();
    expect(t.view().phase).toBe('not-connected');
  });

  it('offers the tools on the phone home screen and opens one when pressed', async () => {
    const t = setup();
    t.controller.phoneConnected();
    const ids = t.lastScreen().form.fields.map((f: { id: string }) => f.id);
    expect(ids).toEqual([PHONE_FIELD.STATUS, 'gi-tool-encryption', PHONE_FIELD.DISCONNECT]);
    await t.controller.phoneInput('gi-tool-encryption', null);
    expect(t.ports.tools.open).toHaveBeenCalledWith('encryption');
  });

  it('while suspended for a tool, ignores pages and phone input; resume asks again for the active tab', async () => {
    const t = setup();
    t.page[1] = dashboard();
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    t.controller.suspend();
    const shown = t.ports.phone.show.mock.calls.length;

    t.page[1] = signInPage('p9');
    await t.controller.pageStateReceived(1, signInPage('p9'));
    await t.controller.phoneInput('password', 'secret');
    expect(t.ports.page.detect).not.toHaveBeenCalled();
    expect(t.ports.page.fill).not.toHaveBeenCalled();
    expect(t.ports.phone.show.mock.calls.length).toBe(shown);

    await t.controller.resume();
    expect(t.view().phase).toBe('requesting');
    expect(t.lastScreen().form.id).toBe(FORM.id);
  });

  it('suspending drops a sign-in in progress', async () => {
    const t = setup();
    t.page[1] = signInPage();
    t.controller.phoneConnected();
    await t.controller.activeTabChanged(1);
    expect(t.view().phase).toBe('requesting');
    t.controller.suspend();
    expect(t.view().phase).toBe('ready');
    await t.controller.phoneInput('login', null);
    expect(t.ports.page.fill).not.toHaveBeenCalled();
  });

  describe('two-step sign-in', () => {
    const notices = (t: ReturnType<typeof setup>) => t.lastScreen().form.fields.filter((f: { type: string }) => f.type === 'info').map((f: { value: string }) => f.value);

    it('asks for the username, then for the password on the next page, then reports signed in', async () => {
      const t = setup();
      t.page[1] = usernamePage('u1');
      t.controller.phoneConnected();
      await t.controller.activeTabChanged(1);
      expect(t.view()).toMatchObject({ phase: 'requesting', step: 'username', twoStep: true });
      expect(notices(t)).toEqual([USERNAME_STEP_NOTICE]);

      await t.controller.phoneInput('username', 'you@company.com');
      await t.controller.phoneInput('login', null);
      expect(t.view().phase).toBe('submitted');

      t.advance(2000);
      t.page[1] = signInPage('p1');
      await t.controller.pageStateReceived(1, signInPage('p1'));
      expect(t.view()).toMatchObject({ phase: 'requesting', step: 'password', twoStep: true, notice: undefined });
      expect(notices(t)).toEqual([PASSWORD_STEP_NOTICE]);

      await t.controller.phoneInput('password', 'secret');
      await t.controller.phoneInput('login', null);
      t.advance(1500);
      await t.controller.pageStateReceived(1, dashboard('d1'));
      expect(t.view().phase).toBe('signed-in');
      expect(t.view().signedInMs).toBe(3500);
    });

    it('treats the password field appearing in the same page as progress, not a rejection', async () => {
      const t = setup();
      t.page[1] = usernamePage('s1');
      t.controller.phoneConnected();
      await t.controller.activeTabChanged(1);
      await t.controller.phoneInput('login', null);

      const passwordStep: PageState = { pageId: 's1', host: 'tools.example.com', hasSignInForm: true, step: 'password' };
      t.page[1] = passwordStep;
      await t.controller.pageStateReceived(1, passwordStep);
      expect(t.view()).toMatchObject({ phase: 'requesting', step: 'password', notice: undefined });
      expect(t.timers[0].cancelled).toBe(true);
    });

    it('reports a rejected username when the username page comes back', async () => {
      const t = setup();
      t.page[1] = usernamePage('u1');
      t.controller.phoneConnected();
      await t.controller.activeTabChanged(1);
      await t.controller.phoneInput('login', null);

      t.page[1] = usernamePage('u2');
      await t.controller.pageStateReceived(1, usernamePage('u2'));
      expect(t.view()).toMatchObject({ phase: 'requesting', step: 'username', notice: REJECTED_NOTICE });
    });

    it('follows the page when the user moves to the password step without the phone', async () => {
      const t = setup();
      t.page[1] = usernamePage('s1');
      t.controller.phoneConnected();
      await t.controller.activeTabChanged(1);
      const passwordStep: PageState = { pageId: 's1', host: 'tools.example.com', hasSignInForm: true, step: 'password' };
      t.page[1] = passwordStep;
      await t.controller.pageStateReceived(1, passwordStep);
      expect(t.view()).toMatchObject({ phase: 'requesting', step: 'password' });
      expect(t.ports.page.detect).toHaveBeenCalledTimes(2);
    });

    it('a one-step sign-in shows no step notice', async () => {
      const t = setup();
      t.page[1] = signInPage();
      t.controller.phoneConnected();
      await t.controller.activeTabChanged(1);
      expect(t.view().twoStep).toBe(false);
      expect(notices(t)).toEqual([]);
    });
  });

  describe('per-site settings', () => {
    it('does not ask the phone on a site with detection turned off, and asks once it is turned on', async () => {
      const t = setup();
      t.ports.sites.get.mockReturnValue({ autoSubmit: false, detect: false });
      t.page[1] = signInPage();
      t.controller.phoneConnected();
      await t.controller.activeTabChanged(1);
      expect(t.view()).toMatchObject({ phase: 'detection-off', host: 'tools.example.com' });
      expect(t.ports.page.detect).not.toHaveBeenCalled();

      t.ports.sites.get.mockReturnValue({ autoSubmit: false, detect: true });
      await t.controller.detectionChanged();
      expect(t.view().phase).toBe('requesting');
    });

    it('turning detection off during a request gives the phone its home screen back', async () => {
      const t = setup();
      t.page[1] = signInPage();
      t.controller.phoneConnected();
      await t.controller.activeTabChanged(1);
      t.ports.sites.get.mockReturnValue({ autoSubmit: false, detect: false });
      await t.controller.detectionChanged();
      expect(t.view().phase).toBe('detection-off');
      expect(t.lastScreen().id).toBe('gi-panel-home');
      await t.controller.phoneInput('password', 'secret');
      expect(t.ports.page.fill).not.toHaveBeenCalled();
    });

    it('presses the page button by itself once every field is filled, when auto-submit is on', async () => {
      const t = setup();
      t.ports.sites.get.mockReturnValue({ autoSubmit: true, detect: true });
      t.page[1] = signInPage();
      t.controller.phoneConnected();
      await t.controller.activeTabChanged(1);
      await t.controller.phoneInput('username', 'you@company.com');
      expect(t.timers.filter(timer => timer.ms === AUTO_SUBMIT_DELAY_MS)).toHaveLength(0);
      await t.controller.phoneInput('password', 'secret');
      const autoTimer = t.timers.find(timer => timer.ms === AUTO_SUBMIT_DELAY_MS)!;
      autoTimer.callback();
      await vi.waitFor(() => expect(t.view().phase).toBe('submitted'));
      expect(t.ports.page.fill).toHaveBeenLastCalledWith(1, 'login', null, 'tools.example.com');
    });

    it('waits for the phone button when auto-submit is off', async () => {
      const t = setup();
      t.page[1] = signInPage();
      t.controller.phoneConnected();
      await t.controller.activeTabChanged(1);
      await t.controller.phoneInput('username', 'you@company.com');
      await t.controller.phoneInput('password', 'secret');
      expect(t.timers).toHaveLength(0);
      expect(t.view().phase).toBe('requesting');
    });

    it('saves the auto-detected form as a page rule for the site', async () => {
      const t = setup();
      t.page[1] = signInPage();
      t.controller.phoneConnected();
      await t.controller.activeTabChanged(1);
      expect(t.view().autoRule).toEqual(AUTO_RULE);
      t.controller.saveAutoRule();
      expect(t.ports.rules.save).toHaveBeenCalledWith('tools.example.com', AUTO_RULE);
      expect(t.view()).toMatchObject({ ruleSource: 'rule', autoRule: undefined });
    });
  });
});
