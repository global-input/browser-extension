// Messages between the side panel and the page (content script) for Page control: the page is
// analysed for what can be operated, and the panel (and through it the phone) refers to each
// control by a short id. Elements and selectors never leave the page.

export const PAGE_CONTROL_MESSAGE = {
  // panel -> page: find what can be operated on the page.
  ANALYSE: 'pagecontrol/analyse',
  // panel -> page: outline a control on the page for a few seconds.
  HIGHLIGHT: 'pagecontrol/highlight',
  // panel -> page: carry out the phone's input on one control.
  ACT: 'pagecontrol/act',
  // panel -> page: scroll or go back, on any page.
  PAGE_ACTION: 'pagecontrol/page-action',
  // panel -> page: Page control closed; stop watching the page.
  STOP: 'pagecontrol/stop',
  // page -> panel: the page changed since it was analysed; carries the new PageModel. Sent
  // from an analysis until the panel stops it or doesn't answer { status: 'ok' }.
  CHANGED: 'pagecontrol/changed',
} as const;

// How many controls an analysis includes, and how far "Show more" can raise it while keeping
// the phone's form usable.
export const MAX_CONTROLS = 30;
export const MAX_CONTROLS_LIMIT = 150;

export const isPageControlMessage = (messageType: unknown) => typeof messageType === 'string' && messageType.startsWith('pagecontrol/');

export type ControlKind =
  | 'text'
  | 'multiline'
  | 'secret'
  | 'number'
  | 'date'
  | 'choice'
  | 'multi-choice'
  | 'toggle'
  | 'button'
  | 'link'
  | 'range'
  | 'media';

export interface ControlOption {
  value: string;
  label: string;
}

export interface PageControl {
  id: string;
  kind: ControlKind;
  label: string;
  // The current value; never for 'secret'.
  value?: string | number | boolean | string[];
  options?: ControlOption[];
  min?: number;
  max?: number;
  step?: number;
  // A form's submit button, or the like.
  primary?: boolean;
  // How a date or time is typed, for example 'YYYY-MM-DD'.
  format?: string;
  // Video and audio: what is playing, in whole seconds, and the volume (0 when muted).
  media?: MediaState;
}

export interface MediaState {
  playing: boolean;
  position: number;
  // Missing for live streams and media not loaded yet.
  duration?: number;
  volume: number;
}

export type MediaOperation = { type: 'toggle' } | { type: 'seek'; seconds: number } | { type: 'volume'; percent: number };

export interface ControlGroup {
  id: string;
  title: string;
  controls: PageControl[];
}

export interface PageModel {
  host: string;
  title: string;
  // 'dialog' when an open dialog limits what can be operated.
  scope: 'page' | 'dialog';
  groups: ControlGroup[];
  // Controls found but not included, by kind, to keep the phone's list short.
  more: { links: number; buttons: number; fields: number };
}

// A control as remembered for a site: by kind and the page's name, not by where it is.
export interface ControlRef {
  kind: ControlKind;
  label: string;
}

// What the page needs of what is remembered for the site: pinned controls rank first (so they
// are never left out), hidden ones are left out.
export interface SiteCustom {
  pinned: ControlRef[];
  hidden: ControlRef[];
}

export interface AnalyseRequest {
  expectedHost: string;
  // How many controls to include ("Show more" raises it); MAX_CONTROLS when missing.
  limit?: number;
  custom?: SiteCustom;
}

export type AnalyseReply = { status: 'success'; model: PageModel } | { status: 'error'; reason: 'host-mismatch' };

export interface HighlightRequest {
  expectedHost: string;
  id: string;
}

export type HighlightReply = { status: 'success' } | { status: 'error'; reason: 'host-mismatch' | 'gone' };

export type ControlValue = string | number | boolean | string[];

export interface ActRequest {
  expectedHost: string;
  id: string;
  // Text for fields, the chosen value(s) for choices, on or off for toggles, a number for
  // sliders; nothing for buttons and links.
  value?: ControlValue;
  // For video and audio.
  media?: MediaOperation;
}

export type ActReply =
  // newTab: a link meant for a new tab; the panel opens it, as the page can't without a click.
  | { status: 'success'; newTab?: string }
  | { status: 'error'; reason: 'host-mismatch' | 'gone' | 'disabled' | 'unsupported' };

export type PageAction = 'up' | 'down' | 'back';

export interface PageActionRequest {
  expectedHost: string;
  action: PageAction;
}

export type PageActionReply = { status: 'success' } | { status: 'error'; reason: 'host-mismatch' };

export interface ChangedReport {
  model: PageModel;
}
