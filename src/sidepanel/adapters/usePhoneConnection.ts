// The one Global Input connection of the panel. The session stays the same while the panel
// is open: when the phone leaves (app in the background, network change), global-input-react
// registers the same session again, so the phone can come back from the app's History without
// a new scan. The QR code is therefore shown only for a fresh session (see connectionPhase).
// reset() starts a new session, so the old one can no longer be joined. Saving new connection
// settings (relay or keys) also starts a new session, with them.
// The session is also kept while the panel is closed (see sessionStore): it is saved once a phone
// has connected, resumed when the panel opens, and cleared by a new session.
import { useEffect, useMemo, useRef, useState } from 'react';
import { onConnectionRecordChange, useMobile } from 'global-input-mobile';
import type { InitData } from 'global-input-react';
import type { PhoneScreen } from '../core/phoneForms';
import { connectionPhase, retryDelay, serviceState } from '../core/connectionPhase';
import type { ServiceState } from '../core/connectionPhase';
import { resumeConfigOf, toSavedSession } from '../core/savedSession';
import type { SessionStore } from './sessionStore';

export const usePhoneConnection = (initialScreen: PhoneScreen, store: SessionStore) => {
  const initData = useMemo(() => initialScreen as unknown as InitData, [initialScreen]);
  const resume = useMemo(() => (store.resume ? resumeConfigOf(store.resume) : null), [store]);
  // A tool opened in the panel uses the same connection with its own screen and handlers.
  // Changing claimId makes this hook connect again with the same session: with the phone still
  // connected that only sends the panel's screen and makes the panel the receiver of the
  // phone's input again; after a failure to reach the service it tries again.
  const [claimId, setClaimId] = useState(0);
  const mobile = useMobile(initData, true, claimId, resume);
  const restart = () => {
    store.clear();
    mobile.restart();
  };
  // useMobile reads the settings on each render, so restart after the re-render this causes.
  const [settingsVersion, setSettingsVersion] = useState(0);
  useEffect(() => onConnectionRecordChange(() => setSettingsVersion(version => version + 1)), []);
  useEffect(() => {
    if (settingsVersion) restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsVersion]);

  const phase = connectionPhase(mobile);
  const service = serviceState(mobile);

  // When the phone last connected, so the user can find this session in the app's History.
  const [lastConnectedAt, setLastConnectedAt] = useState<number | null>(store.resume ? store.resume.lastConnectedAt : null);
  useEffect(() => {
    if (phase === 'connected') {
      const now = Date.now();
      setLastConnectedAt(now);
      const saved = toSavedSession(mobile.getSessionData(), store.settingsKey(), now);
      if (saved) store.save(saved);
    }
    if (phase === 'fresh') setLastConnectedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // A resumed session must be registered on the node the phone's History entry points to. The
  // entry, not the panel, chooses the node; if it chose another one, the phone can't come back,
  // so start fresh with a QR code.
  const checkedNode = useRef(!store.resume);
  useEffect(() => {
    if (checkedNode.current || service !== 'ready' || !store.resume) return;
    checkedNode.current = true;
    const current = mobile.getSessionData();
    if (current && current.session === store.resume.session && current.url !== store.resume.url) restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  return {
    mobile,
    phase,
    service,
    lastConnectedAt,
    // Another phone tried to join this session and was refused (one phone per session).
    deniedOtherPhone: !!mobile.isConnectionDenied,
    errorMessage: mobile.errorMessage,
    show: (screen: PhoneScreen) => mobile.sendInitData(screen as unknown as InitData),
    onInput: (listener: (fieldId: string, value: unknown) => void) =>
      mobile.setOnchange(({ field }) => listener(field.id as string, field.value)),
    // Ends the session: a new session id and key, so a new QR code.
    reset: restart,
    reclaim: () => setClaimId(id => id + 1),
  };
};

export type PhoneConnection = ReturnType<typeof usePhoneConnection>;

// Tries to reach the service again, with the same session, after it failed: with a growing
// delay, and at once when the browser reports it is online again. Paused while `enabled` is
// false (a tool owns the connection; leaving the tool reconnects anyway).
export const useServiceRetry = (service: ServiceState, enabled: boolean, retry: () => void) => {
  const retryRef = useRef(retry);
  retryRef.current = retry;
  const attempt = useRef(0);
  useEffect(() => {
    if (service === 'ready') attempt.current = 0;
  }, [service]);
  useEffect(() => {
    if (service !== 'error' || !enabled) return undefined;
    const again = () => {
      attempt.current += 1;
      retryRef.current();
    };
    const timer = setTimeout(again, retryDelay(attempt.current));
    window.addEventListener('online', again);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', again);
    };
  }, [service, enabled]);
};
