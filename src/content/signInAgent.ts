// The page side of phone sign-in: reports whether the page shows a sign-in form, finds the
// form's fields, and fills them. Values are written straight into the page and never kept.
import { detectSignInRule, detectUsernameStepRule, hasVisiblePasswordField, signInStepOf } from './autoDetect';
import { buildPageForm, setFieldValue, toMobileForm } from './formBuilder';
import type { PageForm } from './formBuilder';
import { SIGN_IN_MESSAGE } from '../shared/signInMessages';
import type { DetectReply, DetectRequest, FillReply, FillRequest, PageState } from '../shared/signInMessages';

const CHANGE_DEBOUNCE_MS = 400;

const randomId = () => Math.random().toString(36).slice(2, 12);

export interface SignInAgentOptions {
  doc?: Document;
  send?: (message: object) => void;
}

export const createSignInAgent = ({ doc = document, send = sendToExtension }: SignInAgentOptions = {}) => {
  const pageId = randomId();
  let pageForm: PageForm | null = null;
  let lastReported: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const state = (): PageState => {
    const step = signInStepOf(doc);
    return { pageId, host: doc.location.host, hasSignInForm: step !== null, step };
  };

  // Reported when the step changes, including username -> password within one page.
  const report = (force = false) => {
    const current = state();
    const key = String(current.step);
    if (!force && key === lastReported) {
      return;
    }
    lastReported = key;
    if (!current.hasSignInForm) {
      pageForm = null;
    }
    send({ messageType: SIGN_IN_MESSAGE.PAGE_STATE, content: current });
  };

  const scheduleReport = () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => report(), CHANGE_DEBOUNCE_MS);
  };

  const detect = ({ rule }: DetectRequest): DetectReply => {
    const host = doc.location.host;
    let ruleSource: DetectReply['ruleSource'] = 'rule';
    let step: DetectReply['step'] = hasVisiblePasswordField(doc) ? 'password' : 'username';
    pageForm = buildPageForm(rule, doc);
    if (!pageForm) {
      ruleSource = 'auto';
      pageForm = buildPageForm(detectSignInRule(doc), doc);
      step = 'password';
    }
    if (!pageForm) {
      pageForm = buildPageForm(detectUsernameStepRule(doc), doc);
      step = 'username';
    }
    if (!pageForm) {
      return { status: 'failed', pageId, host };
    }
    return { status: 'success', pageId, host, form: toMobileForm(pageForm), ruleSource, step };
  };

  const fill = ({ fieldId, value, expectedHost }: FillRequest): FillReply => {
    if (doc.location.host !== expectedHost) {
      return { status: 'error', reason: 'host-mismatch' };
    }
    if (!pageForm) {
      return { status: 'error', reason: 'no-form' };
    }
    const field = setFieldValue(pageForm, fieldId, value);
    if (!field) {
      return { status: 'error', reason: 'no-field' };
    }
    return { status: 'success', pressed: field.type === 'button' };
  };

  const handle = (message: { messageType: string; content?: any }, reply: (response: object) => void) => {
    switch (message.messageType) {
      case SIGN_IN_MESSAGE.DETECT:
        reply(detect(message.content || { rule: null }));
        break;
      case SIGN_IN_MESSAGE.FILL:
        reply(fill(message.content));
        break;
      case SIGN_IN_MESSAGE.QUERY_STATE:
        reply(state());
        break;
      default:
        reply({ status: 'error' });
    }
  };

  const start = () => {
    report(true);
    new MutationObserver(scheduleReport).observe(doc.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'type'],
    });
    // A page restored from the back/forward cache is a page the panel has not seen.
    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        report(true);
      }
    });
  };

  return { start, handle, detect, fill, state };
};

// No side panel open means nobody is listening; that is normal.
const sendToExtension = (message: object) => {
  try {
    chrome.runtime.sendMessage(message).catch(() => undefined);
  } catch (error) {
    // The extension was reloaded or removed while this page stayed open.
  }
};
