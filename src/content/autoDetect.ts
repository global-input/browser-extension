// Finds a sign-in form on a page that has no page rule: exactly one visible password field,
// the text or email field before it, and the submit button. The result is an ordinary page
// rule, so it can be shown, saved and edited like a hand-written one.
import type { PageRule } from '../shared/pageRule';
import type { SignInStep } from '../shared/signInMessages';

export const isVisible = (element: Element) => {
  const box = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
};

const visiblePasswordFields = (doc: Document) =>
  Array.from(doc.querySelectorAll<HTMLInputElement>('input[type="password"]')).filter(isVisible);

export const hasVisiblePasswordField = (doc: Document = document) => visiblePasswordFields(doc).length > 0;

const cssEscape = (value: string) => (window.CSS && CSS.escape ? CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&'));

const isUnique = (doc: Document, selector: string) => {
  try {
    return doc.querySelectorAll(selector).length === 1;
  } catch (error) {
    return false;
  }
};

export const selectorFor = (element: Element): string => {
  const doc = element.ownerDocument;
  if (element.id && isUnique(doc, `#${cssEscape(element.id)}`)) {
    return `#${cssEscape(element.id)}`;
  }
  const tag = element.tagName.toLowerCase();
  const name = element.getAttribute('name');
  if (name) {
    const byName = `${tag}[name="${name.replace(/"/g, '\\"')}"]`;
    if (isUnique(doc, byName)) {
      return byName;
    }
  }
  const path: string[] = [];
  let node: Element | null = element;
  while (node && node !== doc.documentElement) {
    if (node.id && isUnique(doc, `#${cssEscape(node.id)}`)) {
      path.unshift(`#${cssEscape(node.id)}`);
      break;
    }
    let step = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    if (parent) {
      const current: Element = node;
      const sameTag = Array.from(parent.children).filter(child => child.tagName === current.tagName);
      if (sameTag.length > 1) {
        step += `:nth-of-type(${sameTag.indexOf(current) + 1})`;
      }
    }
    path.unshift(step);
    node = parent;
  }
  return path.join(' > ');
};

const labelFor = (element: HTMLInputElement, fallback: string) => {
  const label = element.labels && element.labels.length ? (element.labels[0].textContent || '').trim() : '';
  return label || element.getAttribute('aria-label') || element.getAttribute('placeholder') || fallback;
};

const TEXT_LIKE = /^(text|email|tel|)$/;

const isTextLike = (element: HTMLInputElement) => TEXT_LIKE.test((element.getAttribute('type') || '').toLowerCase());

const submitButtonIn = (scope: ParentNode) => {
  const buttons = Array.from(scope.querySelectorAll<HTMLElement>('button, input[type="submit"]')).filter(isVisible);
  return buttons.find(element => (element.getAttribute('type') || 'submit').toLowerCase() === 'submit') || buttons[0] || null;
};

const buttonLabelOf = (button: HTMLElement, fallback: string) => (button.textContent || (button as HTMLInputElement).value || '').trim() || fallback;

const signInRule = (doc: Document, fields: PageRule['forms'][number]['fields']): PageRule => {
  const host = doc.location.hostname;
  return { hostnames: { value: [host] }, forms: [{ title: `${host} Sign In`, fields }] };
};

// A page asking for the password: the password field, the text or email field before it
// (left out when the page shows the username only as text, as the second step of a two-step
// sign-in does), and the submit button.
export const detectSignInRule = (doc: Document = document): PageRule | null => {
  const passwords = visiblePasswordFields(doc);
  if (passwords.length !== 1) {
    return null;
  }
  const password = passwords[0];
  const scope: Document | HTMLFormElement = password.form || doc;
  const inputs = Array.from(scope.querySelectorAll<HTMLInputElement>('input')).filter(element => isVisible(element) && isTextLike(element));
  const before = inputs.filter(element => element.compareDocumentPosition(password) & Node.DOCUMENT_POSITION_FOLLOWING);
  const username = before.length ? before[before.length - 1] : null;
  const submit = submitButtonIn(scope);
  if (!submit) {
    return null;
  }
  return signInRule(doc, [
    ...(username ? [{ id: 'username', type: 'text', selector: selectorFor(username), data: { label: labelFor(username, 'Username') } }] : []),
    { id: 'password', type: 'secret', selector: selectorFor(password), data: { label: labelFor(password, 'Password') } },
    { id: 'login', type: 'button', selector: selectorFor(submit), data: { label: buttonLabelOf(submit, 'Sign in') } },
  ]);
};

// The first step of a two-step sign-in: a page that asks only for the username or email.
// A lone email field is common (newsletters, search, checkout), so it also needs a sign-in
// signal: a hidden password field in the same form, autocomplete="username", or sign-in
// wording in the address, title, headings or button.
const USERNAME_HINT = /(user|e-?mail|login|logon|account|identifier|phone)/i;
const SIGN_IN_WORDS = /\b(sign[\s_-]?in|log[\s_-]?in|logon|authenticat\w*|sso)\b/i;

const looksLikeUsername = (input: HTMLInputElement) => {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();
  if (/\b(username|email)\b/.test(autocomplete) || (input.getAttribute('type') || '').toLowerCase() === 'email') {
    return true;
  }
  return ['name', 'id', 'aria-label', 'placeholder'].some(attribute => USERNAME_HINT.test(input.getAttribute(attribute) || ''));
};

const hasSignInContext = (doc: Document, input: HTMLInputElement, scope: ParentNode, submit: HTMLElement) => {
  if (scope.querySelector('input[type="password"]')) {
    return true;
  }
  if (/\busername\b/i.test(input.getAttribute('autocomplete') || '')) {
    return true;
  }
  const headings = Array.from(doc.querySelectorAll('h1, h2')).map(heading => heading.textContent || '').join(' ');
  const text = [doc.location.hostname, doc.location.pathname, doc.title, headings, buttonLabelOf(submit, '')].join(' ');
  return SIGN_IN_WORDS.test(text);
};

export const detectUsernameStepRule = (doc: Document = document): PageRule | null => {
  if (visiblePasswordFields(doc).length) {
    return null;
  }
  const candidates = Array.from(doc.querySelectorAll<HTMLInputElement>('input')).filter(
    input => isVisible(input) && isTextLike(input) && !input.readOnly && !input.disabled && !input.closest('[role="search"]')
  );
  for (const input of candidates) {
    const scope: Document | HTMLFormElement = input.form || doc;
    const visibleTextInputs = Array.from(scope.querySelectorAll<HTMLInputElement>('input')).filter(
      element => isVisible(element) && isTextLike(element)
    );
    if (visibleTextInputs.length !== 1 || !looksLikeUsername(input)) {
      continue;
    }
    const submit = submitButtonIn(scope);
    if (!submit || !hasSignInContext(doc, input, scope, submit)) {
      continue;
    }
    return signInRule(doc, [
      { id: 'username', type: 'text', selector: selectorFor(input), data: { label: labelFor(input, 'Username') } },
      { id: 'login', type: 'button', selector: selectorFor(submit), data: { label: buttonLabelOf(submit, 'Next') } },
    ]);
  }
  return null;
};


// Which sign-in step the page shows, if any.
export const signInStepOf = (doc: Document = document): SignInStep | null => {
  if (hasVisiblePasswordField(doc)) {
    return 'password';
  }
  return detectUsernameStepRule(doc) ? 'username' : null;
};
