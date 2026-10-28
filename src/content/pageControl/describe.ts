// What a control is (its kind), what it is called (its accessible name, as the page shows or
// announces it), and its current value. Secret values are never read.
import type { ControlKind, ControlOption } from '../../shared/pageControlMessages';

const MAX_LABEL = 60;
const MAX_VALUE = 500;

export const normalise = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();

const shorten = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const SECRET_AUTOCOMPLETE = /\b(current-password|new-password|one-time-code|cc-number|cc-csc)\b/i;
const SECRET_NAME = /(^|[^a-z])(pin|otp|cvv|cvc|csc|passcode|password|passwd)([^a-z]|$)/i;

const inputType = (element: Element) => (element.getAttribute('type') || 'text').toLowerCase();

const isSecretInput = (input: HTMLInputElement) =>
  inputType(input) === 'password' ||
  SECRET_AUTOCOMPLETE.test(input.getAttribute('autocomplete') || '') ||
  SECRET_NAME.test(`${input.name} ${input.id}`);

const ROLE_KINDS: Record<string, ControlKind> = {
  button: 'button',
  tab: 'button',
  menuitem: 'button',
  link: 'link',
  checkbox: 'toggle',
  switch: 'toggle',
  slider: 'range',
  textbox: 'text',
};

const INPUT_KINDS: Record<string, ControlKind | null> = {
  text: 'text',
  email: 'text',
  search: 'text',
  tel: 'text',
  url: 'text',
  number: 'number',
  date: 'date',
  time: 'date',
  'datetime-local': 'date',
  month: 'date',
  week: 'date',
  checkbox: 'toggle',
  radio: 'choice',
  range: 'range',
  submit: 'button',
  button: 'button',
  reset: 'button',
  image: 'button',
  password: 'secret',
  hidden: null,
  file: null,
  color: null,
};

const isEditable = (element: Element) => {
  const value = element.getAttribute('contenteditable');
  return value === '' || value === 'true' || value === 'plaintext-only';
};

// A link that only runs script acts as a button.
const isScriptLink = (link: HTMLAnchorElement) => {
  const href = (link.getAttribute('href') || '').trim();
  return href === '' || href === '#' || href.toLowerCase().startsWith('javascript:');
};

export const kindOf = (element: Element): ControlKind | null => {
  const tag = element.tagName.toLowerCase();
  if (tag === 'video' || tag === 'audio') return 'media';
  if (tag === 'select') return (element as HTMLSelectElement).multiple ? 'multi-choice' : 'choice';
  if (tag === 'textarea') return 'multiline';
  if (tag === 'input') {
    const input = element as HTMLInputElement;
    const kind = inputType(input) in INPUT_KINDS ? INPUT_KINDS[inputType(input)] : 'text';
    return kind === 'text' && isSecretInput(input) ? 'secret' : kind;
  }
  if (tag === 'button') return 'button';
  if (tag === 'a' && element.hasAttribute('href')) return isScriptLink(element as HTMLAnchorElement) ? 'button' : 'link';
  const role = (element.getAttribute('role') || '').toLowerCase();
  if (role in ROLE_KINDS) return ROLE_KINDS[role];
  if (isEditable(element)) return 'multiline';
  return null;
};

const textOfIds = (element: Element, ids: string) =>
  normalise(
    ids
      .split(/\s+/)
      .map(id => element.ownerDocument.getElementById(id)?.textContent || '')
      .join(' ')
  );

// A <label> can wrap its field; the field's own text (a drop-down's options) is not the name.
const labelText = (label: Element) => {
  const copy = label.cloneNode(true) as Element;
  copy.querySelectorAll('select, textarea, button, input').forEach(control => control.remove());
  return copy.textContent;
};

const labelElementText = (element: Element) => {
  const labels = (element as HTMLInputElement).labels;
  if (!labels || !labels.length) return '';
  return normalise(Array.from(labels).map(labelText).join(' '));
};

const imageAlt = (element: Element) => normalise(element.querySelector('img[alt]')?.getAttribute('alt'));

// The name a screen reader would announce, simplified: aria-labelledby, aria-label, <label>,
// the text of buttons and links (or an image's alt), title, placeholder, then a button value.
export const nameOf = (element: Element, kind: ControlKind): string => {
  const labelledBy = element.getAttribute('aria-labelledby');
  const candidates = [
    labelledBy ? textOfIds(element, labelledBy) : '',
    normalise(element.getAttribute('aria-label')),
    labelElementText(element),
    kind === 'button' || kind === 'link' || kind === 'toggle' ? normalise(element.textContent) || imageAlt(element) : '',
    normalise(element.getAttribute('title')),
    normalise(element.getAttribute('placeholder')),
    element.tagName === 'INPUT' && kind === 'button' ? normalise((element as HTMLInputElement).value || element.getAttribute('alt')) : '',
  ];
  return shorten(candidates.find(Boolean) || '', MAX_LABEL);
};

export const optionsOf = (element: Element): ControlOption[] => {
  if (element.tagName === 'SELECT') {
    return Array.from((element as HTMLSelectElement).options)
      .filter(option => !option.disabled)
      .map(option => ({ value: option.value, label: shorten(normalise(option.textContent) || option.value, MAX_LABEL) }));
  }
  return [];
};

// The current value, as the phone should show it. Never the value of a secret field.
export const valueOf = (element: Element, kind: ControlKind): string | number | boolean | string[] | undefined => {
  switch (kind) {
    case 'secret':
    case 'button':
    case 'link':
      return undefined;
    case 'toggle':
      return element.tagName === 'INPUT' ? (element as HTMLInputElement).checked : element.getAttribute('aria-checked') === 'true';
    case 'multi-choice':
      return Array.from((element as HTMLSelectElement).selectedOptions).map(option => option.value);
    case 'range': {
      const raw = element.tagName === 'INPUT' ? (element as HTMLInputElement).value : element.getAttribute('aria-valuenow');
      const value = Number(raw);
      return Number.isFinite(value) ? value : undefined;
    }
    case 'media':
      return undefined;
    default: {
      const raw = isEditable(element) ? element.textContent : (element as HTMLInputElement).value;
      const value = normalise(raw);
      return value ? shorten(value, MAX_VALUE) : undefined;
    }
  }
};

export const rangeOf = (element: Element) => {
  const read = (attribute: string, aria: string) => {
    const value = Number(element.getAttribute(attribute) ?? element.getAttribute(aria));
    return Number.isFinite(value) && (element.hasAttribute(attribute) || element.hasAttribute(aria)) ? value : undefined;
  };
  return { min: read('min', 'aria-valuemin'), max: read('max', 'aria-valuemax'), step: read('step', 'aria-valuestep') };
};

const DATE_FORMATS: Record<string, string> = {
  date: 'YYYY-MM-DD',
  time: 'HH:MM',
  'datetime-local': 'YYYY-MM-DDTHH:MM',
  month: 'YYYY-MM',
  week: 'YYYY-W01',
};

// How the page expects a date or time to be typed.
export const formatOf = (element: Element): string | undefined =>
  element.tagName === 'INPUT' ? DATE_FORMATS[inputType(element)] : undefined;

export const isPrimaryButton = (element: Element) =>
  (element.tagName === 'BUTTON' && (element.getAttribute('type') || 'submit').toLowerCase() === 'submit' && !!(element as HTMLButtonElement).form) ||
  (element.tagName === 'INPUT' && inputType(element) === 'submit');
