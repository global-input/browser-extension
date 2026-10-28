// Talks to the content script in a tab, and follows which tab is active in the panel's window.
// Uses only APIs that need no extra permission: tabs.query/onActivated/sendMessage
// (no URLs are read from tabs) and runtime messages, where Chrome supplies the sender's tab
// and origin.
import type { PageRule } from '../../shared/pageRule';
import { SIGN_IN_MESSAGE } from '../../shared/signInMessages';
import type { DetectReply, FillFocusedReply, FillReply, PageState, ReadFocusedReply } from '../../shared/signInMessages';
import type { Ports } from '../core/signInController';
import { PAGE_CONTROL_MESSAGE } from '../../shared/pageControlMessages';
import type { ActReply, AnalyseReply, ChangedReport, ControlValue, HighlightReply, MediaOperation, PageAction, PageActionReply, PageModel } from '../../shared/pageControlMessages';

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

// Page control: what can be operated on the active tab, and outlining one control there.
export const analyseActivePage = async (expectedHost: string, limit?: number) => {
  const tabId = await activeTabId();
  return tabId === null ? null : sendToTab<AnalyseReply>(tabId, PAGE_CONTROL_MESSAGE.ANALYSE, { expectedHost, limit });
};

export const highlightOnActivePage = async (expectedHost: string, id: string) => {
  const tabId = await activeTabId();
  return tabId === null ? null : sendToTab<HighlightReply>(tabId, PAGE_CONTROL_MESSAGE.HIGHLIGHT, { expectedHost, id });
};

// Carries out the phone's input on one control of the active tab. A link meant for a new tab
// comes back as newTab, and is opened here next to the active tab.
export const actOnActivePage = async (expectedHost: string, id: string, value?: ControlValue, media?: MediaOperation) => {
  const tabId = await activeTabId();
  const reply = tabId === null ? null : await sendToTab<ActReply>(tabId, PAGE_CONTROL_MESSAGE.ACT, { expectedHost, id, value, media });
  if (reply && reply.status === 'success' && reply.newTab && /^https?:/i.test(reply.newTab)) {
    await chrome.tabs.create({ url: reply.newTab, active: true });
  }
  return reply;
};

export const pageActionOnActivePage = async (expectedHost: string, action: PageAction) => {
  const tabId = await activeTabId();
  return tabId === null ? null : sendToTab<PageActionReply>(tabId, PAGE_CONTROL_MESSAGE.PAGE_ACTION, { expectedHost, action });
};

// Page control is closed: the page stops reporting changes.
export const stopPageControl = async () => {
  const tabId = await activeTabId();
  if (tabId !== null) await sendToTab(tabId, PAGE_CONTROL_MESSAGE.STOP);
};

// Changes reported by pages while Page control is open. Answering { status: 'ok' } keeps the
// page reporting (onChange returns false for a page Page control no longer operates); the
// model's host must match the origin Chrome gives for the sender.
export const watchPageControlChanges = (onChange: (tabId: number, model: PageModel) => boolean) => {
  const listener = (message: any, sender: chrome.runtime.MessageSender, reply: (response: object) => void) => {
    if (!message || message.messageType !== PAGE_CONTROL_MESSAGE.CHANGED || !sender.tab || sender.tab.id === undefined) {
      return;
    }
    const report = message.content as ChangedReport;
    const senderUrl = sender.origin || sender.url;
    if (!senderUrl || !report || !report.model || new URL(senderUrl).host !== report.model.host) {
      return;
    }
    reply({ status: onChange(sender.tab.id, report.model) ? 'ok' : 'stop' });
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
};
