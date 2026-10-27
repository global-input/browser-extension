// Values shown on the computer's screen hide again by themselves: after a short time, or when
// the panel is no longer visible. Insert and Copy keep working while a value is hidden.
import { useEffect, useRef } from 'react';

export const AUTO_HIDE_MS = 30_000;

export const watchAutoHide = (hide: () => void, doc: Document = document, ms = AUTO_HIDE_MS) => {
  const timer = setTimeout(hide, ms);
  const onVisibility = () => {
    if (doc.visibilityState === 'hidden') {
      hide();
    }
  };
  doc.addEventListener('visibilitychange', onVisibility);
  return () => {
    clearTimeout(timer);
    doc.removeEventListener('visibilitychange', onVisibility);
  };
};

// While `shown` is true, calls hide() once the value should hide again.
export const useAutoHide = (shown: boolean, hide: () => void) => {
  const hideRef = useRef(hide);
  hideRef.current = hide;
  useEffect(() => (shown ? watchAutoHide(() => hideRef.current()) : undefined), [shown]);
};
