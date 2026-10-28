// The phone's side of Page control, as pure functions: the page model becomes a phone form in
// the page's own words, and the phone's input becomes an action on the page.
// Phone field types are the Global Input App's (text, secret, list, range, button, info).
// Video and audio get Play or Pause, Position (when the length is known) and Volume.
// Fields with a viewId are shown after all the others, so only the page actions use rows.
import type { FormField } from 'global-input-react';
import type { ControlValue, MediaOperation, PageAction, PageControl, PageModel } from '../../../shared/pageControlMessages';

export const PHONE_IDS = {
  status: 'pc-status',
  up: 'pc-up',
  down: 'pc-down',
  back: 'pc-back',
  analyse: 'pc-analyse',
  close: 'pc-close',
  more: 'pc-more',
} as const;

// Video and audio take several phone fields, with ids made from the control's id.
const MEDIA_PARTS = { play: 'play', position: 'position', volume: 'volume' } as const;
type MediaPart = (typeof MEDIA_PARTS)[keyof typeof MEDIA_PARTS];
const mediaFieldId = (control: PageControl, part: MediaPart) => `${control.id}:${part}`;

// How many more controls "Show more" asks for.
export const MORE_STEP = 30;

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

const mediaFields = (control: PageControl): FormField[] => {
  const media = control.media || { playing: false, position: 0, volume: 100 };
  return [
    { id: mediaFieldId(control, MEDIA_PARTS.play), type: 'button', label: `${media.playing ? '⏸ Pause' : '▶ Play'} – ${control.label}` },
    ...(media.duration
      ? [{ id: mediaFieldId(control, MEDIA_PARTS.position), type: 'range', label: 'Position (seconds)', value: media.position, minimumValue: 0, maximumValue: media.duration, step: 1 }]
      : []),
    { id: mediaFieldId(control, MEDIA_PARTS.volume), type: 'range', label: 'Volume', value: media.volume, minimumValue: 0, maximumValue: 100, step: 5 },
  ];
};

// The values the phone shows for a control, by phone field id; none for secrets and buttons.
export const phoneValueEntriesOf = (control: PageControl): [string, FormField['value']][] => {
  if (control.kind === 'media') {
    return mediaFields(control)
      .filter(field => field.type === 'range')
      .map(field => [field.id as string, field.value]);
  }
  const value = phoneValueOf(control);
  return value === undefined ? [] : [[control.id, value]];
};

// The phone fields for a control: one, several for video and audio, or none when the phone
// can't show it.
export const phoneFieldsOf = (control: PageControl): FormField[] => {
  if (control.kind === 'media') return mediaFields(control);
  const field = phoneFieldOf(control);
  return field ? [field] : [];
};

const phoneFieldOf = (control: PageControl): FormField | null => {
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

export const moreCountOf = (model: PageModel) => model.more.links + model.more.buttons + model.more.fields;

export const phoneFormOf = (model: PageModel, status = '') => {
  const fields: FormField[] = [{ id: PHONE_IDS.status, type: 'info', value: status }];
  for (const group of model.groups) {
    const controls = group.controls.flatMap(phoneFieldsOf);
    if (!controls.length) continue;
    fields.push({ id: group.id, type: 'info', value: `— ${group.title} —` }, ...controls);
  }
  const more = moreCountOf(model);
  if (more) fields.push({ id: PHONE_IDS.more, type: 'button', label: `Show ${Math.min(more, MORE_STEP)} more` });
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
  JSON.stringify([
    moreCountOf(model) > 0,
    model.groups.map(group => [
      group.title,
      group.controls.map(control => [
        control.id,
        control.kind,
        control.label,
        (control.options || []).map(option => option.value),
        control.media ? [control.media.playing, !!control.media.duration] : null,
      ]),
    ]),
  ]);

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
  for (const [id, value] of controlsOf(model).flatMap(phoneValueEntriesOf)) values.set(id, valueKeyOf(value));
  return values;
};

// Values the page changed by itself, to send to the phone. What the phone typed comes back
// from the page the same, so it isn't sent back while the user types. A long text the page
// reports shortened (ending in "…") is not sent back either.
export const phoneValueChangesOf = (model: PageModel, shown: Map<string, string>) => {
  const changes: { id: string; value: FormField['value']; key: string }[] = [];
  for (const [id, value] of controlsOf(model).flatMap(phoneValueEntriesOf)) {
    const key = valueKeyOf(value);
    const before = shown.get(id) ?? '';
    if (key === before || (key.endsWith('…') && before.startsWith(key.slice(0, -1)))) continue;
    changes.push({ id, value, key });
  }
  return changes;
};

export type PhoneInput =
  | { type: 'control'; control: PageControl; value?: ControlValue }
  | { type: 'media'; control: PageControl; operation: MediaOperation }
  | { type: 'page'; action: PageAction }
  | { type: 'more' }
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

const mediaInputOf = (control: PageControl, part: string, value: unknown): PhoneInput | null => {
  const number = Number(value);
  switch (part) {
    case MEDIA_PARTS.play:
      return { type: 'media', control, operation: { type: 'toggle' } };
    case MEDIA_PARTS.position:
      return Number.isFinite(number) ? { type: 'media', control, operation: { type: 'seek', seconds: number } } : null;
    case MEDIA_PARTS.volume:
      return Number.isFinite(number) ? { type: 'media', control, operation: { type: 'volume', percent: number } } : null;
    default:
      return null;
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
    case PHONE_IDS.more:
      return { type: 'more' };
    default: {
      const [controlId, part] = fieldId.split(':');
      if (part) {
        const media = findControl(model, controlId);
        return media && media.kind === 'media' ? mediaInputOf(media, part, value) : null;
      }
      const control = findControl(model, fieldId);
      return control ? { type: 'control', control, value: valueFor(control, value) } : null;
    }
  }
};

// What the panel says the phone did, without any value.
export const describeInput = (input: PhoneInput) => {
  if (input.type === 'page') return { up: 'Scrolled up', down: 'Scrolled down', back: 'Went back' }[input.action];
  if (input.type === 'more') return 'Asked for more controls';
  if (input.type !== 'control' && input.type !== 'media') return '';
  const name = `“${input.control.label}”`;
  if (input.type === 'media') {
    const playing = input.control.media && input.control.media.playing;
    return { toggle: `${playing ? 'Paused' : 'Played'} ${name}`, seek: `Moved the position of ${name}`, volume: `Changed the volume of ${name}` }[input.operation.type];
  }
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
