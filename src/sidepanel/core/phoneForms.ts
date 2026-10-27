// What the phone shows at each step. These are Global Input "initData" forms; the app draws
// them with its own styling. Field ids that start with "gi-" belong to the panel, all other
// ids are the page's own form fields.
import type { MobileForm } from '../../shared/pageRule';

export const PHONE_FIELD = {
  STATUS: 'gi-status',
  SKIP: 'gi-skip',
  DONE: 'gi-done',
  DISCONNECT: 'gi-disconnect',
  SEND_TEXT: 'gi-send-text',
  TEXT: 'gi-text',
  TEXT_SEND: 'gi-text-send',
  TEXT_BACK: 'gi-text-back',
} as const;

// Tool buttons on the home screen are "gi-tool-<tool id>".
const TOOL_PREFIX = 'gi-tool-';
export const toolFieldId = (toolId: string) => `${TOOL_PREFIX}${toolId}`;
export const toolIdFromField = (fieldId: string) => (fieldId.startsWith(TOOL_PREFIX) ? fieldId.slice(TOOL_PREFIX.length) : null);

export interface ToolEntry {
  id: string;
  label: string;
}

export interface PhoneScreen {
  id?: string;
  form: {
    id?: string;
    title: string;
    domain?: string;
    fields: object[];
  };
}

const info = (value: string) => ({ id: PHONE_FIELD.STATUS, type: 'info', value });
const button = (id: string, label: string) => ({ id, type: 'button', label });

export const homeScreen = (tools: ToolEntry[] = []): PhoneScreen => ({
  id: 'gi-panel-home',
  form: {
    title: 'Connected to your browser',
    fields: [
      info('Waiting for a sign-in page. Open a site on your computer.'),
      button(PHONE_FIELD.SEND_TEXT, 'Send text'),
      ...tools.map(tool => button(toolFieldId(tool.id), tool.label)),
      button(PHONE_FIELD.DISCONNECT, 'Disconnect'),
    ],
  },
});

// The page's own fields, so the app offers the account saved for this exact form id
// (###username###@host), plus a way out.
export const signInScreen = (form: MobileForm, host: string, notice?: string): PhoneScreen => ({
  id: `gi-panel-signin-${host}`,
  form: {
    id: form.id,
    title: `Sign in to ${host}`,
    domain: host,
    fields: [
      ...(notice ? [info(notice)] : []),
      ...form.fields.map(({ id, label, type, value, items, selectType }) => ({ id, label, type, value, items, selectType })),
      button(PHONE_FIELD.SKIP, 'Skip'),
    ],
  },
});

export const signedInScreen = (host: string): PhoneScreen => ({
  id: 'gi-panel-signed-in',
  form: {
    title: 'Signed in',
    fields: [info(`Signed in to ${host}`), button(PHONE_FIELD.SEND_TEXT, 'Send text'), button(PHONE_FIELD.DONE, 'Done')],
  },
});

// Text (a one-time code, for example) for the field that has focus on the computer.
export const textScreen = (host: string | undefined, notice?: string): PhoneScreen => ({
  id: 'gi-panel-text',
  form: {
    title: 'Send to the focused field',
    fields: [
      info(notice || (host ? `Goes into the field that has focus on ${host}.` : 'Goes into the field that has focus in the browser.')),
      { id: PHONE_FIELD.TEXT, type: 'text', label: 'Text or code', value: '' },
      button(PHONE_FIELD.TEXT_SEND, 'Send'),
      button(PHONE_FIELD.TEXT_BACK, 'Back'),
    ],
  },
});
