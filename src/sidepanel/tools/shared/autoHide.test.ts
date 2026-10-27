import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTO_HIDE_MS, watchAutoHide } from './autoHide';

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
};

afterEach(() => {
  vi.useRealTimers();
  setVisibility('visible');
});

describe('auto hide', () => {
  it('hides after the time is up, and not after stopping', () => {
    vi.useFakeTimers();
    const hide = vi.fn();
    watchAutoHide(hide);
    vi.advanceTimersByTime(AUTO_HIDE_MS - 1);
    expect(hide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(hide).toHaveBeenCalledTimes(1);

    const later = vi.fn();
    watchAutoHide(later)();
    vi.advanceTimersByTime(AUTO_HIDE_MS);
    expect(later).not.toHaveBeenCalled();
  });

  it('hides when the panel is no longer visible', () => {
    const hide = vi.fn();
    const stop = watchAutoHide(hide);
    setVisibility('hidden');
    expect(hide).toHaveBeenCalledTimes(1);
    stop();
  });
});
