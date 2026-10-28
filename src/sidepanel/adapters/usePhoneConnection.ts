// The one Global Input connection of the panel. The session stays the same while the panel
// is open: when the phone drops (app in the background, network change), global-input-react
// reconnects with the same session, so the phone can rejoin from the app's history without
// a new scan. disconnect() starts a new session, so the old one can no longer be joined.
// Saving new connection settings (relay or keys) also starts a new session, with them.
import { useEffect, useMemo, useState } from 'react';
import { onConnectionRecordChange, useMobile } from 'global-input-mobile';
import type { InitData } from 'global-input-react';
import type { PhoneScreen } from '../core/phoneForms';

export type ConnectionStatus = 'connecting' | 'waiting' | 'connected' | 'error';

export const usePhoneConnection = (initialScreen: PhoneScreen) => {
  const initData = useMemo(() => initialScreen as unknown as InitData, [initialScreen]);
  // A tool opened in the panel uses the same connection with its own screen and handlers.
  // Changing claimId makes this hook connect again: with the phone still connected that only
  // sends the panel's screen and makes the panel the receiver of the phone's input again.
  const [claimId, setClaimId] = useState(0);
  const mobile = useMobile(initData, true, claimId);
  // useMobile reads the settings on each render, so restart after the re-render this causes.
  const [settingsVersion, setSettingsVersion] = useState(0);
  useEffect(() => onConnectionRecordChange(() => setSettingsVersion(version => version + 1)), []);
  useEffect(() => {
    if (settingsVersion) mobile.restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsVersion]);
  const status: ConnectionStatus = mobile.isConnected ? 'connected' : mobile.isError ? 'error' : mobile.isReady ? 'waiting' : 'connecting';
  return {
    mobile,
    status,
    // The phone was connected and dropped; it can rejoin from the app's history.
    canRejoin: !!mobile.isDisconnected && status === 'waiting',
    errorMessage: mobile.errorMessage,
    show: (screen: PhoneScreen) => mobile.sendInitData(screen as unknown as InitData),
    onInput: (listener: (fieldId: string, value: unknown) => void) =>
      mobile.setOnchange(({ field }) => listener(field.id as string, field.value)),
    disconnect: () => mobile.restart(),
    reclaim: () => setClaimId(id => id + 1),
  };
};
