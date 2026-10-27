// Panel preferences. Nothing secret, so the extension's localStorage is enough.
export interface PanelSettings {
  idleMinutes: number;
  disconnectOnLock: boolean;
}

export const DEFAULT_SETTINGS: PanelSettings = { idleMinutes: 30, disconnectOnLock: true };
export const IDLE_CHOICES = [15, 30, 60, 120];

const KEY = 'iterative.globalInputApp.sidePanel.settings';

export const loadSettings = (): PanelSettings => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    return { ...DEFAULT_SETTINGS, ...(saved || {}) };
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: PanelSettings) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch (error) {
    // Settings then last until the panel closes.
  }
};
