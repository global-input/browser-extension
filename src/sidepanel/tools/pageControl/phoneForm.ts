// The phone's side of Page control, as pure functions: the page model becomes a phone form in
// the page's own words, and the phone's input becomes an action on the page.
// Phone field types are the Global Input App's (text, secret, list, range, button, info).
// Fields with a viewId are shown after all the others, so only the page actions use rows.
import type { FormField } from 'global-input-react';
import type { ControlValue, PageAction, PageControl, PageModel } from '../../../shared/pageControlMessages';

export const PHONE_IDS = {
  status: 'pc-status',
  up: 'pc-up',
  down: 'pc-down',
  back: 'pc-back',
  analyse: 'pc-analyse',
  close: 'pc-close',
} as const;

const TOGGLE_ON = 'on';

const PAGE_ACTIONS: FormField[] = [
  { id: PHONE_IDS.up, type: 'button', label: '↑ Up', viewId: 'pc-row1' },
  { id: PHONE_IDS.down, type: 'button', label: '↓ Down', viewId: 'pc-row1' },
  { id: PHONE_IDS.back, type: 'button', label: '← Go back', viewId: 'pc-row1' },
  { id: PHONE_IDS.analyse, type: 'button', label: 'Analyse again', viewId: 'pc-row2' },
  { id: PHONE_IDS.close, type: 'button', label: 'Close', viewId: 'pc-row2' },
];

// A control's value as the phone shows it; undefined for secrets and for what has no value.
export const phoneValueOf = (control: PageControl): FormField['value'] | undefined => {
  switch (control.kind) {
    case 'text':
    case 'number':
    case 'date':
    case 'multiline':
      return typeof control.value === 'string' || typeof control.value === 'number' ? String(control.value) : '';
    case 'choice':
    case 'multi-choice':
      return Array.isArray(control.value) ? control.value : control.value === undefined ? [] : [String(control.value)];
    case 'toggle':
      return control.value === true ? [TOGGLE_ON] : [];
    case 'range':
      return typeof control.value === 'number' ? control.value : 0;
    default:
      return undefined;
  }
};

const textField = (control: PageControl, nLines: number): FormField => ({
  id: control.id,
  type: 'text',
  label: control.format ? `${control.label} (${control.format})` : control.label,
  nLines,
  value: phoneValueOf(control),
});

// One phone field for a control, or null for what the phone can't operate yet (video and audio).
export const phoneFieldOf = (control: PageControl): FormField | null => {
  switch (control.kind) {
    case 'text':
    case 'number':
    case 'date':
      return textField(control, 1);
    case 'multiline':
      return textField(control, 5);
    case 'secret':
      // A secret's value is never read from the page, so the phone starts empty.
      return { id: control.id, type: 'secret', label: control.label, value: '' };
    case 'choice':
    case 'multi-choice': {
      if (!control.options || !control.options.length) return null;
      return {
        id: control.id,
        type: 'list',
        selectType: control.kind === 'choice' ? 'single' : 'multiple',
        label: control.label,
        items: control.options.map(option => ({ value: option.value, label: option.label })),
        value: phoneValueOf(control),
      };
    }
    case 'toggle':
      return {
        id: control.id,
        type: 'list',
        selectType: 'multiple',
        items: [{ value: TOGGLE_ON, label: control.label }],
        value: phoneValueOf(control),
      };
    case 'range':
      return {
        id: control.id,
        type: 'range',
        label: control.label,
        value: phoneValueOf(control),
        ...(control.min !== undefined && { minimumValue: control.min }),
        ...(control.max !== undefined && { maximumValue: control.max }),
        ...(control.step !== undefined && { step: control.step }),
      };
    case 'button':
      return { id: control.id, type: 'button', label: control.label };
    case 'link':
      return { id: control.id, type: 'button', label: `${control.label} →` };
    default:
      return null;
  }
};

export const phoneFormOf = (model: PageModel, status = '') => {
  const fields: FormField[] = [{ id: PHONE_IDS.status, type: 'info', value: status }];
  for (const group of model.groups) {
    const controls = group.controls.map(phoneFieldOf).filter((field): field is FormField => !!field);
    if (!controls.length) continue;
    fields.push({ id: group.id, type: 'info', value: `— ${group.title} —` }, ...controls);
  }
  fields.push(...PAGE_ACTIONS);
  return { id: `page-control@${model.host}`, form: { title: model.host, fields } };
};

// A phone form while there is no page model: a message, Analyse again and Close.
export const phoneMessageForm = (title: string, message: string) => ({
  id: 'page-control',
  form: {
    title,
    fields: [{ id: PHONE_IDS.status, type: 'info', value: message }, PAGE_ACTIONS[3], PAGE_ACTIONS[4]],
  },
});

// What the phone shows depends on the controls, not on their values, so typing on the phone
// doesn't resend the form.
export const phoneSignatureOf = (model: PageModel) =>
  JSON.stringify(
    model.groups.map(group => [
      group.title,
      group.controls.map(control => [control.id, control.kind, control.label, (control.options || []).map(option => option.value)]),
    ])
  );

// Values compared the way the page reports them: spaces collapsed, choices in any order.
export const valueKeyOf = (value: unknown) => {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map(String).sort().join('\u0000');
  return String(value).replace(/\s+/g, ' ').trim();
};

const controlsOf = (model: PageModel) => model.groups.flatMap(group => group.controls);

// What the phone shows for each control, by id, right after it got the form.
export const phoneValuesOf = (model: PageModel) => {
  const values = new Map<string, string>();
  for (const control of controlsOf(model)) {
    const value = phoneValueOf(control);
    if (value !== undefined) values.set(control.id, valueKeyOf(value));
  }
  return values;
};

// Values the page changed by itself, to send to the phone. What the phone typed comes back
// from the page the same, so it isn't sent back while the user types. A long text the page
// reports shortened (ending in "…") is not sent back either.
export const phoneValueChangesOf = (model: PageModel, shown: Map<string, string>) => {
  const changes: { id: string; value: FormField['value']; key: string }[] = [];
  for (const control of controlsOf(model)) {
    const value = phoneValueOf(control);
    if (value === undefined) continue;
    const key = valueKeyOf(value);
    const before = shown.get(control.id) ?? '';
    if (key === before || (key.endsWith('…') && before.startsWith(key.slice(0, -1)))) continue;
    changes.push({ id: control.id, value, key });
  }
  return changes;
};

export type PhoneInput =
  | { type: 'control'; control: PageControl; value?: ControlValue }
  | { type: 'page'; action: PageAction }
  | { type: 'analyse' }
  | { type: 'close' };

const findControl = (model: PageModel | null, id: string) => {
  for (const group of model ? model.groups : []) {
    const control = group.controls.find(item => item.id === id);
    if (control) return control;
  }
  return null;
};

const valueFor = (control: PageControl, value: unknown): ControlValue | undefined => {
  const list = Array.isArray(value) ? value.map(String) : value === undefined || value === null ? [] : [String(value)];
  switch (control.kind) {
    case 'choice':
      return list[0];
    case 'multi-choice':
      return list;
    case 'toggle':
      return Array.isArray(value) ? list.includes(TOGGLE_ON) : value === true;
    case 'range': {
      const number = Number(value);
      return Number.isFinite(number) ? number : undefined;
    }
    case 'button':
    case 'link':
      return undefined;
    default:
      return typeof value === 'string' ? value : list.join(', ');
  }
};

export const phoneInputOf = (model: PageModel | null, fieldId: string, value: unknown): PhoneInput | null => {
  switch (fieldId) {
    case PHONE_IDS.up:
      return { type: 'page', action: 'up' };
    case PHONE_IDS.down:
      return { type: 'page', action: 'down' };
    case PHONE_IDS.back:
      return { type: 'page', action: 'back' };
    case PHONE_IDS.analyse:
      return { type: 'analyse' };
    case PHONE_IDS.close:
      return { type: 'close' };
    default: {
      const control = findControl(model, fieldId);
      return control ? { type: 'control', control, value: valueFor(control, value) } : null;
    }
  }
};

// What the panel says the phone did, without any value.
export const describeInput = (input: PhoneInput) => {
  if (input.type === 'page') return { up: 'Scrolled up', down: 'Scrolled down', back: 'Went back' }[input.action];
  if (input.type !== 'control') return '';
  const name = `“${input.control.label}”`;
  switch (input.control.kind) {
    case 'button':
      return `Pressed ${name}`;
    case 'link':
      return `Opened ${name}`;
    case 'choice':
    case 'multi-choice':
      return `Chose in ${name}`;
    case 'toggle':
      return `Turned ${name} ${input.value ? 'on' : 'off'}`;
    case 'range':
      return `Moved ${name}`;
    default:
      return `Typing into ${name}`;
  }
};
