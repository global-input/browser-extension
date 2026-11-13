// How a tool tells the user to get the phone connected: scan in the Sign in tab for a fresh
// session, or come back from the app's History while the panel waits for the previous phone.
import { connectionPhase } from '../../core/connectionPhase';
import type { MobileFlags } from '../../core/connectionPhase';

export const phoneHint = (mobile: MobileFlags) =>
  connectionPhase(mobile) === 'waiting'
    ? "Reconnect your phone from the Global Input App's History"
    : 'Connect your phone in the Sign in tab';
