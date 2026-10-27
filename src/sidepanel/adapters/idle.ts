// Calls back when the computer has been idle for the given time, or its screen locks.
export type IdleReason = 'idle' | 'locked';

export const watchIdle = (idleMinutes: number, disconnectOnLock: boolean, onIdle: (reason: IdleReason) => void) => {
  chrome.idle.setDetectionInterval(Math.max(1, Math.round(idleMinutes * 60)));
  const listener = (state: string) => {
    if (state === 'idle' || (state === 'locked' && disconnectOnLock)) {
      onIdle(state);
    }
  };
  chrome.idle.onStateChanged.addListener(listener);
  return () => chrome.idle.onStateChanged.removeListener(listener);
};
