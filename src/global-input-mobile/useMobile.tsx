import { useState, useCallback } from "react";
import { useGlobalInputApp } from 'global-input-react';
import type { InitData, ConnectOptions } from 'global-input-react';
import * as storage from "./storage";
import { WidgetState, MobileData } from "./commons";

export const useMobile = (
  initData: InitData | (() => InitData),
  showWidgetOnStart = false,
  configId: string | number = "default"
): MobileData => {
  const [isShowWidget, setShowWidget] = useState<boolean>(showWidgetOnStart);
  const [settingsConfig, setSettingsConfigId] = useState<number>(1);
  const [widgetState, setWidgetState] = useState<WidgetState>(WidgetState.CONNECT_QR);
  
  const connectionSettings: storage.ConnectionSettings = storage.loadConnectionSettings();
  
  const connectOptions: ConnectOptions = {
    url: connectionSettings.url,
    apikey: connectionSettings.apikey,
    securityGroup: connectionSettings.securityGroup,
  };

  const mobile = useGlobalInputApp(
    {
      initData,
      options: connectOptions,
      codeAES: connectionSettings.codeKey,
    },
    isShowWidget,
    `${settingsConfig}-${configId}`
  );

  const { close } = mobile;

  const onSaveSettings = useCallback(
    (settings: storage.ConnectionSettings): void => {
      if (storage.saveConnectionSettings(settings)) {
        setWidgetState(WidgetState.PAIRING);
      } else {
        setWidgetState(WidgetState.CONNECT_QR);
      }
      setSettingsConfigId((configId) => configId + 1);
      close();
    },
    [close]
  );

  const loadSettings = useCallback(
    (): storage.ConnectionSettings => connectionSettings,
    [connectionSettings]
  );

  return {
    ...mobile,
    isShowWidget,
    onSaveSettings,
    loadSettings,
    widgetState,
    setWidgetState,
    setShowWidget,
  };
};