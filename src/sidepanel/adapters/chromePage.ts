// Talks to the content script in a tab, and follows which tab is active in the panel's window.
// Uses only APIs that need no extra permission: tabs.query/onActivated/sendMessage
// (no URLs are read from tabs) and runtime messages, where Chrome supplies the sender's tab
// and origin.
import type { PageRule } from '../../shared/pageRule';
import { SIGN_IN_MESSAGE } from '../../shared/signInMessages';
import type { DetectReply, FillFocusedReply, FillReply, PageState, ReadFocusedReply } from '../../shared/signInMessages';
import type { Ports } from '../core/signInController';

const sendToTab = async <T>(tabId: number, messageType: string, content?: unknown): Promise<T | null> => {
  try {
    const reply = await chrome.tabs.sendMessage(tabId, { messageType, content });
    return (reply as T) || null;
  } catch (error) {
    // No content script there: a browser page, the Web Store, or a tab opened before the
    // extension was installed or updated.
    return null;
  }
};

export const chromePagePort: Ports['page'] = {
  queryState: tabId => sendToTab<PageState>(tabId, SIGN_IN_MESSAGE.QUERY_STATE),
  detect: (tabId, rule: PageRule | null) => sendToTab<DetectReply>(tabId, SIGN_IN_MESSAGE.DETECT, { rule }),
  fill: (tabId, fieldId, value, expectedHost) => sendToTab<FillReply>(tabId, SIGN_IN_MESSAGE.FILL, { fieldId, value, expectedHost }),
  fillFocused: (tabId, value, expectedHost) => sendToTab<FillFocusedReply>(tabId, SIGN_IN_MESSAGE.FILL_FOCUSED, { value, expectedHost }),
};

// Calls back with the active tab of this window now and whenever it changes.
export const watchActiveTab = (onActiveTab: (tabId: number) => void) => {
  let windowId: number | null = null;
  const onActivated = (info: chrome.tabs.OnActivatedInfo) => {
    if (info.windowId === windowId) {
      onActiveTab(info.tabId);
    }
  };
  chrome.tabs.onActivated.addListener(onActivated);
  chrome.windows.getCurrent().then(current => {
    windowId = current.id ?? null;
    return chrome.tabs.query({ active: true, windowId: current.id });
  }).then(tabs => {
    if (tabs[0] && tabs[0].id !== undefined) {
      onActiveTab(tabs[0].id);
    }
  });
  return () => chrome.tabs.onActivated.removeListener(onActivated);
};

// Page reports. The host in the report must match the origin Chrome gives for the sender.
export const watchPageStates = (onState: (tabId: number, state: PageState) => void) => {
  const listener = (message: any, sender: chrome.runtime.MessageSender) => {
    if (!message || message.messageType !== SIGN_IN_MESSAGE.PAGE_STATE || !sender.tab || sender.tab.id === undefined) {
      return;
    }
    const state = message.content as PageState;
    // Firefox gives no sender.origin; sender.url also comes from the browser, not the page.
    const senderUrl = sender.origin || sender.url;
    if (!senderUrl || !state || new URL(senderUrl).host !== state.host) {
      return;
    }
    onState(sender.tab.id, state);
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
};

// The active tab of the panel's window, for tools that act on the page.
export const activeTabId = async (): Promise<number | null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab && tab.id !== undefined ? tab.id : null;
};

// The host of the active tab, as its content script reports it; null when the tab has no
// content script that answers (see sendToTab).
export const activeTabHost = async (): Promise<string | null> => {
  const tabId = await activeTabId();
  const state = tabId === null ? null : await chromePagePort.queryState(tabId);
  return state ? state.host : null;
};

// The text of the focused element in a tab, for the tools that encrypt or decrypt in place.
export const readFocused = (tabId: number, expectedHost: string) =>
  sendToTab<ReadFocusedReply>(tabId, SIGN_IN_MESSAGE.READ_FOCUSED, { expectedHost });
