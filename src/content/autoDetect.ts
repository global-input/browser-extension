// Finds a sign-in form on a page that has no page rule: exactly one visible password field,
// the text or email field before it, and the submit button. The result is an ordinary page
// rule, so it can be shown, saved and edited like a hand-written one.
import type { PageRule } from '../shared/pageRule';

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

export const detectSignInRule = (doc: Document = document): PageRule | null => {
  const passwords = visiblePasswordFields(doc);
  if (passwords.length !== 1) {
    return null;
  }
  const password = passwords[0];
  const scope: Document | HTMLFormElement = password.form || doc;
  const inputs = Array.from(scope.querySelectorAll<HTMLInputElement>('input')).filter(
    element => isVisible(element) && /^(text|email|tel|)$/.test((element.getAttribute('type') || '').toLowerCase())
  );
  const before = inputs.filter(element => element.compareDocumentPosition(password) & Node.DOCUMENT_POSITION_FOLLOWING);
  const username = before.length ? before[before.length - 1] : null;
  const buttons = Array.from(scope.querySelectorAll<HTMLElement>('button, input[type="submit"]')).filter(isVisible);
  const submit = buttons.find(element => (element.getAttribute('type') || 'submit').toLowerCase() === 'submit') || buttons[0];
  if (!username || !submit) {
    return null;
  }
  const buttonLabel = (submit.textContent || (submit as HTMLInputElement).value || '').trim() || 'Sign in';
  const host = doc.location.hostname;
  return {
    hostnames: { value: [host] },
    forms: [
      {
        title: `${host} Sign In`,
        fields: [
          { id: 'username', type: 'text', selector: selectorFor(username), data: { label: labelFor(username, 'Username') } },
          { id: 'password', type: 'secret', selector: selectorFor(password), data: { label: labelFor(password, 'Password') } },
          { id: 'login', type: 'button', selector: selectorFor(submit), data: { label: buttonLabel } },
        ],
      },
    ],
  };
};
