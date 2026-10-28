// Carries out the phone's input on the page: types into fields the way typing does (so React
// and similar frameworks notice), chooses options, turns toggles on or off, and presses buttons
// and links. What a control is, is decided here from the element, not from the panel.
import { fireInputEvents, setNativeValue } from '../formBuilder';
import { kindOf } from './describe';
import type { ActReply, ControlValue, MediaOperation, PageAction } from '../../shared/pageControlMessages';

const SUCCESS: ActReply = { status: 'success' };

const isDisabled = (element: Element) =>
  (element as HTMLInputElement).disabled === true || element.getAttribute('aria-disabled') === 'true';

const textOf = (value: ControlValue | undefined) =>
  Array.isArray(value) ? value.join(', ') : value === undefined || value === null ? '' : String(value);

const isOn = (value: ControlValue | undefined) => (Array.isArray(value) ? value.length > 0 : value === true || value === 'true' || value === 'on');

const firstOf = (value: ControlValue | undefined) => (Array.isArray(value) ? value[0] : value === undefined ? undefined : String(value));

const EDITABLE = '[contenteditable]:not([contenteditable="false"])';

// The element that takes the text: the field itself, or the editable area of an editor marked
// role="textbox".
const editableOf = (element: Element): Element | null => {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') return element;
  if ((element as HTMLElement).isContentEditable || element.matches(EDITABLE)) return element;
  return element.querySelector(EDITABLE);
};

const typeInto = (element: Element, text: string) => {
  const editable = element as HTMLElement;
  if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
    // Rich text editors follow the browser's own editing commands; plain text otherwise.
    editable.focus();
    const doc = element.ownerDocument;
    const selection = doc.getSelection();
    if (selection) selection.selectAllChildren(element);
    let inserted = false;
    try {
      inserted = typeof doc.execCommand === 'function' && doc.execCommand('insertText', false, text);
    } catch (error) {
      inserted = false;
    }
    if (!inserted) {
      element.textContent = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }
  setNativeValue(element, text);
  fireInputEvents(element);
};

// The radio buttons of the same group as this one: same name, same form (or none).
const radioGroupOf = (radio: HTMLInputElement) => {
  const scope: ParentNode = radio.form || radio.getRootNode() as ParentNode;
  return Array.from(scope.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(
    other => other.name === radio.name && other.form === radio.form
  );
};

const choose = (element: Element, value: ControlValue | undefined): ActReply => {
  const chosen = firstOf(value);
  if (chosen === undefined) return SUCCESS;
  if (element.tagName === 'SELECT') {
    setNativeValue(element, chosen);
    fireInputEvents(element);
    return SUCCESS;
  }
  const radio = radioGroupOf(element as HTMLInputElement).find(other => other.value === chosen);
  if (!radio) return { status: 'error', reason: 'gone' };
  if (!radio.checked) radio.click();
  return SUCCESS;
};

const chooseMany = (element: Element, value: ControlValue | undefined): ActReply => {
  const chosen = new Set(Array.isArray(value) ? value : value === undefined ? [] : [String(value)]);
  for (const option of Array.from((element as HTMLSelectElement).options)) {
    option.selected = chosen.has(option.value);
  }
  fireInputEvents(element);
  return SUCCESS;
};

const toggle = (element: Element, value: ControlValue | undefined): ActReply => {
  const checked = element.tagName === 'INPUT' ? (element as HTMLInputElement).checked : element.getAttribute('aria-checked') === 'true';
  if (checked !== isOn(value)) (element as HTMLElement).click();
  return SUCCESS;
};

const MAX_KEY_PRESSES = 500;

const ariaNumber = (element: Element, name: string) => {
  const value = Number(element.getAttribute(name));
  return element.hasAttribute(name) && Number.isFinite(value) ? value : undefined;
};

// A slider built from ARIA has no value to set; it moves with the keys, as for a keyboard user:
// Home and End for the ends, then arrow keys until it reaches the value.
const slideWithKeys = (element: Element, target: number): ActReply => {
  const press = (key: string) => element.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
  const now = () => ariaNumber(element, 'aria-valuenow');
  const start = now();
  if (start === undefined) return { status: 'error', reason: 'unsupported' };
  (element as HTMLElement).focus?.();
  const min = ariaNumber(element, 'aria-valuemin');
  const max = ariaNumber(element, 'aria-valuemax');
  if (min !== undefined && target <= min) press('Home');
  else if (max !== undefined && target >= max) press('End');
  for (let presses = 0; presses < MAX_KEY_PRESSES; presses++) {
    const before = now();
    if (before === undefined || before === target) break;
    const up = before < target;
    press(up ? 'ArrowRight' : 'ArrowLeft');
    const after = now();
    if (after === undefined || after === before || (up ? after >= target : after <= target)) break;
  }
  return now() === start && start !== target ? { status: 'error', reason: 'unsupported' } : SUCCESS;
};

const slide = (element: Element, value: ControlValue | undefined): ActReply => {
  const number = Number(firstOf(value));
  if (!Number.isFinite(number)) return { status: 'error', reason: 'unsupported' };
  if (element.tagName !== 'INPUT') return slideWithKeys(element, number);
  setNativeValue(element, String(number));
  fireInputEvents(element);
  return SUCCESS;
};

// Playing with sound can be refused by the browser until the user has clicked the page; it then
// plays without sound, and the phone shows the volume at 0 so it can be turned up.
const operateMedia = (media: HTMLMediaElement, operation: MediaOperation | undefined): ActReply => {
  if (!operation) return { status: 'error', reason: 'unsupported' };
  switch (operation.type) {
    case 'toggle':
      if (media.paused || media.ended) {
        Promise.resolve(media.play()).catch(() => {
          media.muted = true;
          return media.play();
        }).catch(() => undefined);
      } else {
        media.pause();
      }
      return SUCCESS;
    case 'seek': {
      const end = Number.isFinite(media.duration) ? media.duration : Infinity;
      if (!Number.isFinite(operation.seconds)) return { status: 'error', reason: 'unsupported' };
      media.currentTime = Math.max(0, Math.min(end, operation.seconds));
      return SUCCESS;
    }
    case 'volume': {
      const percent = Math.max(0, Math.min(100, Number(operation.percent) || 0));
      media.volume = percent / 100;
      media.muted = percent === 0;
      return SUCCESS;
    }
    default:
      return { status: 'error', reason: 'unsupported' };
  }
};

// A page can't open a new tab without a real click, so a link meant for one is opened by the
// panel. Only web addresses are passed on.
const newTabOf = (element: Element) => {
  if (element.tagName !== 'A' || (element.getAttribute('target') || '').toLowerCase() !== '_blank') return undefined;
  const href = (element as HTMLAnchorElement).href;
  return /^https?:/i.test(href) ? href : undefined;
};

const press = (element: Element): ActReply => {
  const newTab = newTabOf(element);
  if (newTab) return { status: 'success', newTab };
  (element as HTMLElement).focus?.();
  (element as HTMLElement).click();
  return SUCCESS;
};

export const actOn = (element: Element, value?: ControlValue, media?: MediaOperation): ActReply => {
  if (isDisabled(element)) return { status: 'error', reason: 'disabled' };
  switch (kindOf(element)) {
    case 'text':
    case 'multiline':
    case 'secret':
    case 'number':
    case 'date': {
      const editable = editableOf(element);
      if (!editable) return { status: 'error', reason: 'unsupported' };
      typeInto(editable, textOf(value));
      return SUCCESS;
    }
    case 'media':
      return operateMedia(element as HTMLMediaElement, media);
    case 'choice':
      return choose(element, value);
    case 'multi-choice':
      return chooseMany(element, value);
    case 'toggle':
      return toggle(element, value);
    case 'range':
      return slide(element, value);
    case 'button':
    case 'link':
      return press(element);
    default:
      return { status: 'error', reason: 'unsupported' };
  }
};

// Scrolling by most of a screen keeps a little of the previous view for context.
export const doPageAction = (action: PageAction, doc: Document = document) => {
  const view = doc.defaultView;
  if (!view) return;
  if (action === 'back') {
    view.history.back();
    return;
  }
  const distance = Math.round(view.innerHeight * 0.8) * (action === 'up' ? -1 : 1);
  view.scrollBy({ top: distance, behavior: 'smooth' });
};
