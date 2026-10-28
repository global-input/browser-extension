// The elements a person could operate: form fields, buttons, links, media and their ARIA
// equivalents, including inside open shadow roots. Hidden, disabled and inert ones are left out.
import { kindOf } from './describe';
import type { ControlKind } from '../../shared/pageControlMessages';

export type IsVisible = (element: Element) => boolean;

const CANDIDATES = 'input, textarea, select, button, a[href], video, audio, [contenteditable], [role]';
const CLICKABLE = 'button, a[href], [role="button"], [role="link"]';

// Very large pages are cut off here; ranking keeps the phone's list short anyway.
export const MAX_CANDIDATES = 2000;

export interface Candidate {
  element: Element;
  kind: ControlKind;
}

const isDisabled = (element: Element) =>
  (element as HTMLInputElement).disabled === true || element.getAttribute('aria-disabled') === 'true';

const isHiddenFromPeople = (element: Element) => !!element.closest('[aria-hidden="true"], [inert]');

// Text inside a button or link is part of that button or link.
const isInsideClickable = (element: Element) => !!element.parentElement?.closest(CLICKABLE);

// Visually hidden elements (skip links, screen-reader-only text) are moved off the page or
// shrunk to a pixel. Without layout (width and height 0) the visibility check alone decides.
const isOffPage = (element: Element) => {
  const box = element.getBoundingClientRect();
  if (!box.width && !box.height) return false;
  const view = element.ownerDocument.defaultView;
  const left = box.right + (view ? view.scrollX : 0);
  const top = box.bottom + (view ? view.scrollY : 0);
  return left <= 0 || top <= 0 || (box.width <= 1 && box.height <= 1);
};

const usable = (element: Element, kind: ControlKind, visible: IsVisible) =>
  !isDisabled(element) &&
  !isHiddenFromPeople(element) &&
  visible(element) &&
  !isOffPage(element) &&
  (kind === 'media' || !isInsideClickable(element));

export const collectCandidates = (root: Document, visible: IsVisible): Candidate[] => {
  const found: Candidate[] = [];
  const walk = (scope: Document | ShadowRoot) => {
    for (const element of Array.from(scope.querySelectorAll(CANDIDATES))) {
      if (found.length >= MAX_CANDIDATES) return;
      const kind = kindOf(element);
      if (kind && usable(element, kind, visible)) {
        found.push({ element, kind });
      }
    }
    for (const host of Array.from(scope.querySelectorAll('*'))) {
      if (host.shadowRoot) walk(host.shadowRoot);
    }
  };
  walk(root);
  return found;
};
