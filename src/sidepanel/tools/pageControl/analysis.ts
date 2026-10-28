// Pure parts of the analysing Page control: the state of an analysis, and how the page model is
// described in the panel.
import type { AnalyseReply, ControlKind, PageModel } from '../../../shared/pageControlMessages';

export type AnalysisState =
  | { status: 'analysing' }
  // No content script answered: a browser page, or a tab opened before the extension updated.
  | { status: 'unreachable' }
  // The tab now shows another site than the one Page control was opened on.
  | { status: 'other-site'; host?: string }
  | { status: 'done'; model: PageModel; at: number };

export const analysisStateOf = (reply: AnalyseReply | null, now: number): AnalysisState => {
  if (!reply) return { status: 'unreachable' };
  if (reply.status === 'error') return { status: 'other-site' };
  return { status: 'done', model: reply.model, at: now };
};

export const KIND_TEXT: Record<ControlKind, string> = {
  text: 'Text field',
  multiline: 'Text area',
  secret: 'Secret field',
  number: 'Number',
  date: 'Date',
  choice: 'Choice',
  'multi-choice': 'Choices',
  toggle: 'On or off',
  button: 'Button',
  link: 'Link',
  range: 'Slider',
  media: 'Video or audio',
};

export const controlCount = (model: PageModel) => model.groups.reduce((sum, group) => sum + group.controls.length, 0);

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// "7 links and 2 buttons", or '' when nothing was left out.
export const describeMore = ({ links, buttons, fields }: PageModel['more']) => {
  const parts = [
    fields ? plural(fields, 'field', 'fields') : '',
    buttons ? plural(buttons, 'button', 'buttons') : '',
    links ? plural(links, 'link', 'links') : '',
  ].filter(Boolean);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0] || '';
};
