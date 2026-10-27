// Writes text from the phone into the element that has focus on the page: an input, a
// textarea or an editable element. A one-time code split over one-character boxes is spread
// over the boxes, starting at the focused one. Also reads that element's text, for tools that
// encrypt or decrypt it in place (only when the user asks, from the panel).
import { isVisible } from './autoDetect';

const TEXT_INPUT_TYPES = /^(text|email|tel|number|password|search|url|)$/;

export type FocusedFillResult = { status: 'success'; filled: number } | { status: 'error'; reason: 'no-focus' };
export type FocusedReadResult = { status: 'success'; value: string } | { status: 'error'; reason: 'no-focus' | 'empty' };

const isTextInput = (element: Element): element is HTMLInputElement =>
  element instanceof HTMLInputElement && TEXT_INPUT_TYPES.test((element.getAttribute('type') || '').toLowerCase()) && !element.readOnly && !element.disabled;

const setNativeValue = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
};

const isSingleCharacterBox = (element: Element) => isTextInput(element) && element.maxLength === 1;

// The one-character boxes that belong together with the focused one: the nearest ancestor
// (up to four levels) holding enough of them.
const codeBoxesFrom = (focused: HTMLInputElement, length: number): HTMLInputElement[] | null => {
  let ancestor: HTMLElement | null = focused.parentElement;
  for (let level = 0; ancestor && level < 4; level++, ancestor = ancestor.parentElement) {
    const boxes = Array.from(ancestor.querySelectorAll('input')).filter(
      (element): element is HTMLInputElement => isSingleCharacterBox(element) && isVisible(element)
    );
    const start = boxes.indexOf(focused);
    if (start >= 0 && boxes.length - start >= length) {
      return boxes.slice(start, start + length);
    }
  }
  return null;
};

export const fillFocusedElement = (doc: Document, text: string): FocusedFillResult => {
  const focused = doc.activeElement;
  if (!focused || focused === doc.body) {
    return { status: 'error', reason: 'no-focus' };
  }
  if (isTextInput(focused)) {
    const characters = Array.from(text);
    const boxes = isSingleCharacterBox(focused) && characters.length > 1 ? codeBoxesFrom(focused, characters.length) : null;
    if (boxes) {
      boxes.forEach((box, index) => setNativeValue(box, characters[index]));
      boxes[boxes.length - 1].focus();
      return { status: 'success', filled: boxes.length };
    }
    setNativeValue(focused, text);
    return { status: 'success', filled: 1 };
  }
  if (focused instanceof HTMLTextAreaElement && !focused.readOnly && !focused.disabled) {
    setNativeValue(focused, text);
    return { status: 'success', filled: 1 };
  }
  if (focused instanceof HTMLElement && focused.isContentEditable) {
    // insertText keeps rich editors' own state in step; plain text is the fallback.
    const inserted = typeof doc.execCommand === 'function' && doc.execCommand('insertText', false, text);
    if (!inserted) {
      focused.textContent = text;
      focused.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return { status: 'success', filled: 1 };
  }
  return { status: 'error', reason: 'no-focus' };
};

// The text of the focused element, when the element could also take the result back.
export const readFocusedElement = (doc: Document): FocusedReadResult => {
  const focused = doc.activeElement;
  let value: string | null = null;
  if (focused && (isTextInput(focused) || (focused instanceof HTMLTextAreaElement && !focused.readOnly && !focused.disabled))) {
    value = focused.value;
  } else if (focused instanceof HTMLElement && focused !== doc.body && focused.isContentEditable) {
    value = focused.innerText ?? focused.textContent ?? '';
  }
  if (value === null) {
    return { status: 'error', reason: 'no-focus' };
  }
  return value.trim() ? { status: 'success', value } : { status: 'error', reason: 'empty' };
};
