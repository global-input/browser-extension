// What the panel shows for the phone connection. One rule:
// - fresh: a new session; the QR code is shown and nobody can connect without scanning it.
// - waiting: the phone that connected before left; it can come back from the app's History,
//   so the QR code stays hidden until the user presses Reset.
// - connected: the phone is connected.
// The service state (reaching the Global Input relay) only adds a notice; it never brings the
// QR code back while the previous phone could still return.
export type ConnectionPhase = 'fresh' | 'waiting' | 'connected';
export type ServiceState = 'ready' | 'connecting' | 'error';

export interface MobileFlags {
  isConnected?: boolean;
  isDisconnected?: boolean;
  isReady?: boolean;
  isError?: boolean;
}

export const connectionPhase = (mobile: MobileFlags): ConnectionPhase =>
  mobile.isConnected ? 'connected' : mobile.isDisconnected ? 'waiting' : 'fresh';

export const serviceState = (mobile: MobileFlags): ServiceState =>
  mobile.isError ? 'error' : mobile.isConnected || mobile.isReady ? 'ready' : 'connecting';

// Delay before the next attempt to reach the service: 2 s, 4 s, 8 s … up to 60 s.
export const RETRY_MIN_MS = 2000;
export const RETRY_MAX_MS = 60000;
export const retryDelay = (attempt: number) => Math.min(RETRY_MAX_MS, RETRY_MIN_MS * 2 ** Math.max(0, attempt));
