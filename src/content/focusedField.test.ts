import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fillFocusedElement } from './focusedField';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: 20, height: 20 }) as DOMRect);
});

describe('fillFocusedElement', () => {
  it('writes into the focused input with input events', () => {
    document.body.innerHTML = '<input id="code" autocomplete="one-time-code">';
    const input = document.getElementById('code') as HTMLInputElement;
    const onInput = vi.fn();
    input.addEventListener('input', onInput);
    input.focus();
    expect(fillFocusedElement(document, '482913')).toEqual({ status: 'success', filled: 1 });
    expect(input.value).toBe('482913');
    expect(onInput).toHaveBeenCalled();
  });

  it('spreads a code over one-character boxes starting at the focused box', () => {
    document.body.innerHTML = '<div><span><input maxlength="1"></span><span><input maxlength="1"></span><span><input maxlength="1"></span><span><input maxlength="1"></span></div>';
    const boxes = Array.from(document.querySelectorAll('input'));
    boxes[0].focus();
    expect(fillFocusedElement(document, '4829')).toEqual({ status: 'success', filled: 4 });
    expect(boxes.map(box => box.value).join('')).toBe('4829');
    expect(document.activeElement).toBe(boxes[3]);
  });

  it('writes into a textarea', () => {
    document.body.innerHTML = '<textarea></textarea>';
    const area = document.querySelector('textarea')!;
    area.focus();
    fillFocusedElement(document, 'note');
    expect(area.value).toBe('note');
  });

  it('refuses when nothing editable has focus', () => {
    document.body.innerHTML = '<button>Go</button><input type="checkbox"><input readonly value="x">';
    expect(fillFocusedElement(document, 'abc')).toEqual({ status: 'error', reason: 'no-focus' });
    (document.querySelector('input[type=checkbox]') as HTMLElement).focus();
    expect(fillFocusedElement(document, 'abc')).toEqual({ status: 'error', reason: 'no-focus' });
    (document.querySelector('input[readonly]') as HTMLElement).focus();
    expect(fillFocusedElement(document, 'abc')).toEqual({ status: 'error', reason: 'no-focus' });
  });
});
