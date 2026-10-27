// The sign-in flow for the active tab: notices a sign-in form, asks the phone, fills the page
// with what the phone sends, and works out whether the sign-in worked.
// It has no Chrome or React code: everything outside comes in through the ports, so the flow
// can be tested with fakes and the UI or transport can change without touching it.
import type { MobileForm, PageRule } from '../../shared/pageRule';
import type { DetectReply, FillFocusedReply, FillReply, PageState, RuleSource, SignInStep } from '../../shared/signInMessages';
import { PHONE_FIELD, homeScreen, signInScreen, signedInScreen, textScreen, toolIdFromField } from './phoneForms';
import type { PhoneScreen, ToolEntry } from './phoneForms';

// A submitted single-page app that still shows its form after this long did not accept it.
export const SPA_FAILURE_MS = 15000;
const HISTORY_SIZE = 5;

export type Phase =
  | 'not-connected' // no phone: the UI shows the QR code
  | 'ready' // phone connected, no sign-in form on the active tab
  | 'unavailable' // the active tab cannot be used (a browser page, or it needs a reload)
  | 'no-form' // the page asks for a password, but the form could not be read
  | 'requesting' // the phone shows the sign-in form
  | 'submitted' // the phone pressed the page's button; waiting for the outcome
  | 'signed-in'
  | 'skipped'
  | 'detection-off'; // the page asks for a sign-in, but the user turned detection off for the site

export interface SiteSettings {
  // Press the page's button as soon as every field is filled from the phone.
  autoSubmit: boolean;
  // Look for sign-in forms on this site at all.
  detect: boolean;
}

// Pause between the last value and the automatic press, so the page can react to the input.
export const AUTO_SUBMIT_DELAY_MS = 300;

export interface SignInView {
  phase: Phase;
  host?: string;
  ruleSource?: RuleSource;
  filledFieldIds: string[];
  // Set after a rejected attempt, or when something needs the user's attention.
  notice?: string;
  signedInMs?: number;
  recent: { host: string; at: number }[];
  // The step the phone is asked for, and whether this sign-in has a username step first.
  step?: SignInStep;
  twoStep?: boolean;
  // The auto-detected rule of the current request, which the user can save as a page rule.
  autoRule?: PageRule;
  // The phone shows the Send text screen; and the outcome of the last text sent (never the text).
  textMode?: boolean;
  textResult?: { host: string; ok: boolean; message: string };
}

export interface Ports {
  phone: {
    show: (screen: PhoneScreen) => void;
    disconnect: () => void;
  };
  page: {
    queryState: (tabId: number) => Promise<PageState | null>;
    detect: (tabId: number, rule: PageRule | null) => Promise<DetectReply | null>;
    fill: (tabId: number, fieldId: string, value: unknown, expectedHost: string) => Promise<FillReply | null>;
    fillFocused: (tabId: number, value: string, expectedHost: string) => Promise<FillFocusedReply | null>;
  };
  rules: {
    find: (host: string) => PageRule | null;
    save: (host: string, rule: PageRule) => void;
  };
  sites: {
    get: (host: string) => SiteSettings;
  };
  // Other things the phone can start from its home screen (the panel's tools).
  tools: {
    list: () => ToolEntry[];
    open: (toolId: string) => void;
  };
  now: () => number;
  setTimer: (callback: () => void, ms: number) => () => void;
}

interface Target {
  tabId: number;
  pageId: string;
  host: string;
  form: MobileForm;
  step: SignInStep;
  startedAt: number;
}

export const REJECTED_NOTICE = 'The site did not accept the sign-in. Choose the account again.';
export const USERNAME_STEP_NOTICE = 'Step 1 of 2: the username.';
export const PASSWORD_STEP_NOTICE = 'Step 2 of 2: the password.';

export class SignInController {
  private view: SignInView = { phase: 'not-connected', filledFieldIds: [], recent: [] };
  private connected = false;
  private activeTabId: number | null = null;
  private lastState: PageState | null = null;
  private target: Target | null = null;
  private skippedPageId: string | null = null;
  private cancelTimer: (() => void) | null = null;
  // While suspended (a tool owns the phone) page reports are only recorded.
  private suspended = false;
  // The text typed on the phone's Send text screen, kept only until it is sent.
  private pendingText = '';

  constructor(private ports: Ports, private onChange: (view: SignInView) => void) {}

  getView() {
    return this.view;
  }

  phoneConnected() {
    this.connected = true;
    if (this.suspended) {
      return;
    }
    this.ports.phone.show(this.home());
    this.update({ phase: 'ready', notice: undefined });
    if (this.activeTabId !== null) {
      this.refresh(this.activeTabId);
    }
  }

  phoneDisconnected() {
    this.connected = false;
    this.leaveTextMode();
    this.clearTarget();
    this.update({ phase: 'not-connected', host: undefined, notice: undefined, filledFieldIds: [] });
  }

  // A tool takes over the phone: stop asking for sign-ins until resume().
  suspend() {
    this.suspended = true;
    this.leaveTextMode();
    this.clearTarget();
    this.update({ phase: this.connected ? 'ready' : 'not-connected', notice: undefined, filledFieldIds: [] });
  }

  // The panel has the phone again: show the home screen and look at the active tab afresh.
  async resume() {
    this.suspended = false;
    this.skippedPageId = null;
    if (!this.connected) {
      return;
    }
    this.ports.phone.show(this.home());
    if (this.activeTabId !== null) {
      await this.refresh(this.activeTabId);
    }
  }

  async activeTabChanged(tabId: number) {
    if (tabId === this.activeTabId) {
      return;
    }
    this.activeTabId = tabId;
    this.clearTarget();
    this.lastState = null;
    await this.refresh(tabId);
  }

  // A page reported its state. Only the active tab matters; Chrome tells us which tab it is.
  async pageStateReceived(tabId: number, state: PageState) {
    if (tabId !== this.activeTabId) {
      return;
    }
    if (this.suspended) {
      this.lastState = state;
      return;
    }
    await this.handleState(tabId, state);
  }

  async phoneInput(fieldId: string, value: unknown) {
    if (this.suspended) {
      return;
    }
    const toolId = toolIdFromField(fieldId);
    if (toolId) {
      this.ports.tools.open(toolId);
      return;
    }
    switch (fieldId) {
      case PHONE_FIELD.SKIP:
        this.skip();
        return;
      case PHONE_FIELD.DONE:
        this.ports.phone.show(this.home());
        this.update({ phase: 'ready', notice: undefined });
        return;
      case PHONE_FIELD.DISCONNECT:
        this.ports.phone.disconnect();
        return;
      case PHONE_FIELD.SEND_TEXT:
        this.enterTextMode();
        return;
      case PHONE_FIELD.TEXT:
        this.pendingText = typeof value === 'string' ? value : String(value ?? '');
        return;
      case PHONE_FIELD.TEXT_SEND:
        await this.sendText();
        return;
      case PHONE_FIELD.TEXT_BACK:
        this.leaveTextMode();
        this.ports.phone.show(this.home());
        this.update({ phase: 'ready', notice: undefined });
        if (this.activeTabId !== null) {
          await this.refresh(this.activeTabId);
        }
        return;
      default:
    }
    const target = this.target;
    if (!target || (this.view.phase !== 'requesting' && this.view.phase !== 'submitted')) {
      return;
    }
    const reply = await this.ports.page.fill(target.tabId, fieldId, value, target.host);
    if (this.target !== target) {
      return;
    }
    if (!reply || reply.status !== 'success') {
      const notice =
        reply && reply.reason === 'host-mismatch'
          ? 'The page changed to another site, so nothing was filled.'
          : 'Could not fill the page. Reload it and try again.';
      this.clearTarget();
      this.ports.phone.show(this.home());
      this.update({ phase: 'ready', notice });
      return;
    }
    if (reply.pressed) {
      this.submitted(target);
      return;
    }
    if (!this.view.filledFieldIds.includes(fieldId)) {
      this.update({ filledFieldIds: [...this.view.filledFieldIds, fieldId] });
    }
    this.autoSubmitWhenComplete(target);
  }

  // Saves the auto-detected form of the current request as a page rule for the site.
  saveAutoRule() {
    const { autoRule, host } = this.view;
    if (!autoRule || !host) {
      return;
    }
    this.ports.rules.save(host, autoRule);
    this.update({ ruleSource: 'rule', autoRule: undefined });
  }

  // The user turned detection on or off for a site: look at the active tab again.
  async detectionChanged() {
    if (!this.connected || this.suspended || this.activeTabId === null || !this.lastState) {
      return;
    }
    const tabId = this.activeTabId;
    const state = this.lastState;
    const hadRequest = !!this.target;
    this.clearTarget();
    this.skippedPageId = null;
    if (hadRequest) {
      this.ports.phone.show(this.home());
    }
    this.update({ phase: 'ready', notice: undefined, filledFieldIds: [] });
    await this.handleState(tabId, state);
  }

  skip() {
    if (this.target) {
      this.skippedPageId = this.target.pageId;
    }
    this.clearTarget();
    if (this.connected) {
      this.ports.phone.show(this.home());
    }
    this.update({ phase: 'skipped', notice: undefined, filledFieldIds: [] });
  }

  private enterTextMode() {
    this.clearTarget();
    this.pendingText = '';
    const host = this.lastState ? this.lastState.host : undefined;
    this.ports.phone.show(textScreen(host));
    this.update({ textMode: true, textResult: undefined, phase: 'ready', notice: undefined, filledFieldIds: [] });
  }

  private leaveTextMode() {
    this.pendingText = '';
    if (this.view.textMode) {
      this.update({ textMode: false });
    }
  }

  private async sendText() {
    const text = this.pendingText;
    const state = this.lastState;
    const tabId = this.activeTabId;
    if (!text) {
      this.ports.phone.show(textScreen(state ? state.host : undefined, 'Type the text first.'));
      return;
    }
    if (!state || tabId === null) {
      this.ports.phone.show(textScreen(undefined, 'This tab cannot be used. Open a web page and click into a field.'));
      return;
    }
    const reply = await this.ports.page.fillFocused(tabId, text, state.host);
    this.pendingText = '';
    const ok = !!reply && reply.status === 'success';
    const message = ok
      ? `Sent to ${state.host}.`
      : reply && reply.reason === 'host-mismatch'
        ? 'The page changed to another site, so nothing was sent.'
        : 'Click into a field on the page first, then send again.';
    this.ports.phone.show(textScreen(state.host, message));
    this.update({ textResult: { host: state.host, ok, message } });
  }

  private autoSubmitWhenComplete(target: Target) {
    if (!this.ports.sites.get(target.host).autoSubmit) {
      return;
    }
    const inputs = target.form.fields.filter(field => field.type !== 'button' && field.type !== 'info');
    const button = target.form.fields.find(field => field.type === 'button');
    if (!button || !inputs.every(field => this.view.filledFieldIds.includes(field.id))) {
      return;
    }
    this.ports.setTimer(() => {
      if (this.target === target && this.view.phase === 'requesting') {
        this.phoneInput(button.id, null);
      }
    }, AUTO_SUBMIT_DELAY_MS);
  }

  private home() {
    return homeScreen(this.ports.tools.list());
  }

  private async refresh(tabId: number) {
    const state = await this.ports.page.queryState(tabId);
    if (tabId !== this.activeTabId || this.suspended) {
      return;
    }
    if (!state) {
      this.lastState = null;
      if (this.connected) {
        this.update({ phase: 'unavailable', host: undefined, notice: undefined, filledFieldIds: [] });
      }
      return;
    }
    await this.handleState(tabId, state);
  }

  private async handleState(tabId: number, state: PageState) {
    const previousHost = this.lastState ? this.lastState.host : undefined;
    this.lastState = state;
    if (!this.connected) {
      this.update({ host: state.host });
      return;
    }
    if (this.view.textMode) {
      // The Send text screen stays on the phone; it names the site the text will go to.
      if (state.host !== previousHost) {
        this.ports.phone.show(textScreen(state.host));
      }
      this.update({ host: state.host });
      return;
    }
    const target = this.target;
    if (target && this.view.phase === 'submitted') {
      if (!state.hasSignInForm) {
        this.signedIn(target, state.host);
      } else if (target.step === 'username' && state.step === 'password') {
        // The username was accepted: the same page, or the next one, now asks for the password.
        await this.request(tabId, state, undefined, target);
      } else if (state.pageId !== target.pageId) {
        // A new page with the same step again: the site rejected it.
        await this.request(tabId, state, REJECTED_NOTICE);
      }
      return;
    }
    if (!state.hasSignInForm) {
      if (this.view.phase !== 'signed-in') {
        this.clearTarget();
        if (this.view.phase === 'requesting') {
          this.ports.phone.show(this.home());
        }
        this.update({ phase: 'ready', host: state.host, notice: undefined, filledFieldIds: [] });
      }
      return;
    }
    if (!this.ports.sites.get(state.host).detect) {
      this.update({ phase: 'detection-off', host: state.host, notice: undefined, filledFieldIds: [] });
      return;
    }
    if (state.pageId === this.skippedPageId) {
      return;
    }
    if (target && target.pageId === state.pageId && target.step === state.step) {
      return;
    }
    await this.request(tabId, state);
  }

  // continuedFrom: the username step this password step follows, in a two-step sign-in.
  private async request(tabId: number, state: PageState, notice?: string, continuedFrom?: Target) {
    this.clearTarget();
    const reply = await this.ports.page.detect(tabId, this.ports.rules.find(state.host));
    if (tabId !== this.activeTabId || !this.connected || this.suspended || (this.lastState && this.lastState.pageId !== state.pageId)) {
      return;
    }
    if (!reply || reply.status !== 'success' || !reply.form || reply.host !== state.host) {
      this.update({ phase: 'no-form', host: state.host, notice: undefined, filledFieldIds: [] });
      return;
    }
    const step: SignInStep = reply.step || 'password';
    const twoStep = step === 'username' || (!!continuedFrom && this.view.twoStep === true);
    const stepNotice = twoStep ? (step === 'username' ? USERNAME_STEP_NOTICE : PASSWORD_STEP_NOTICE) : undefined;
    const startedAt = continuedFrom ? continuedFrom.startedAt : this.ports.now();
    this.target = { tabId, pageId: reply.pageId, host: reply.host, form: reply.form, step, startedAt };
    this.ports.phone.show(signInScreen(reply.form, reply.host, notice || stepNotice));
    const autoRule = reply.ruleSource === 'auto' ? reply.rule : undefined;
    this.update({ phase: 'requesting', host: reply.host, ruleSource: reply.ruleSource, notice, step, twoStep, autoRule, filledFieldIds: [] });
  }

  private submitted(target: Target) {
    this.update({ phase: 'submitted' });
    this.cancelTimer = this.ports.setTimer(() => {
      // Still the same document, still showing the form: a single-page app that said no.
      if (this.target === target && this.view.phase === 'submitted') {
        this.request(target.tabId, { pageId: target.pageId, host: target.host, hasSignInForm: true, step: target.step }, REJECTED_NOTICE);
      }
    }, SPA_FAILURE_MS);
  }

  private signedIn(target: Target, host: string) {
    const now = this.ports.now();
    this.clearTarget();
    this.ports.phone.show(signedInScreen(target.host));
    this.update({
      phase: 'signed-in',
      host,
      notice: undefined,
      signedInMs: now - target.startedAt,
      recent: [{ host: target.host, at: now }, ...this.view.recent].slice(0, HISTORY_SIZE),
    });
  }

  private clearTarget() {
    this.target = null;
    if (this.cancelTimer) {
      this.cancelTimer();
      this.cancelTimer = null;
    }
  }

  private update(patch: Partial<SignInView>) {
    this.view = { ...this.view, ...patch };
    this.onChange(this.view);
  }
}
