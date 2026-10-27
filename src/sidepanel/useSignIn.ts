// Wires the sign-in controller to Chrome and to the phone connection.
import { useEffect, useRef, useState } from 'react';
import { SignInController } from './core/signInController';
import type { Ports, SignInView } from './core/signInController';
import { chromePagePort, watchActiveTab, watchPageStates } from './adapters/chromePage';
import { pageRulesPort } from './adapters/rules';
import type { usePhoneConnection } from './adapters/usePhoneConnection';

type Connection = ReturnType<typeof usePhoneConnection>;

export const useSignIn = (connection: Connection) => {
  const connectionRef = useRef(connection);
  connectionRef.current = connection;
  const [view, setView] = useState<SignInView | null>(null);
  const controllerRef = useRef<SignInController | null>(null);
  if (!controllerRef.current) {
    const ports: Ports = {
      phone: {
        show: screen => connectionRef.current.show(screen),
        disconnect: () => connectionRef.current.disconnect(),
      },
      page: chromePagePort,
      rules: pageRulesPort,
      now: () => Date.now(),
      setTimer: (callback, ms) => {
        const timer = setTimeout(callback, ms);
        return () => clearTimeout(timer);
      },
    };
    controllerRef.current = new SignInController(ports, setView);
  }
  const controller = controllerRef.current;

  useEffect(() => {
    const stopTabs = watchActiveTab(tabId => controller.activeTabChanged(tabId));
    const stopPages = watchPageStates((tabId, state) => controller.pageStateReceived(tabId, state));
    return () => {
      stopTabs();
      stopPages();
    };
  }, [controller]);

  const connected = connection.status === 'connected';
  useEffect(() => {
    if (connected) {
      controller.phoneConnected();
    } else {
      controller.phoneDisconnected();
    }
  }, [connected, controller]);

  connection.onInput((fieldId, value) => controller.phoneInput(fieldId, value));

  return { view: view || controller.getView(), skip: () => controller.skip() };
};
