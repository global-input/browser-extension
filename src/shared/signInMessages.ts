// Messages between the side panel and the page (content script) for phone sign-in.
// The panel always learns the page's origin from Chrome (sender.origin, sender.tab),
// never from these payloads alone.
import type { MobileForm, PageRule } from './pageRule';

export const SIGN_IN_MESSAGE = {
  // panel -> page: find the sign-in form, using the rule if one is given, else auto-detection.
  DETECT: 'signin/detect',
  // panel -> page: write one value, or press a button, in the detected form.
  FILL: 'signin/fill',
  // panel -> page: report the page state now.
  QUERY_STATE: 'signin/query-state',
  // page -> panel: the page loaded, or its sign-in form appeared or went away.
  PAGE_STATE: 'signin/page-state',
} as const;

export const isSignInMessage = (messageType: unknown) => typeof messageType === 'string' && messageType.startsWith('signin/');

export interface PageState {
  // New for every document, so the panel can tell "the form came back after a reload"
  // from "the form is still there".
  pageId: string;
  host: string;
  hasSignInForm: boolean;
}

export interface DetectRequest {
  rule: PageRule | null;
}

export type RuleSource = 'rule' | 'auto';

export interface DetectReply {
  status: 'success' | 'failed';
  pageId: string;
  host: string;
  form?: MobileForm;
  ruleSource?: RuleSource;
}

export interface FillRequest {
  fieldId: string;
  value: unknown;
  expectedHost: string;
}

export interface FillReply {
  status: 'success' | 'error';
  reason?: 'host-mismatch' | 'no-form' | 'no-field';
  // True when the field was a button (the form was submitted).
  pressed?: boolean;
}
