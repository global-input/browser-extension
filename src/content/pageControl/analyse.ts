// Analyses the page for what can be operated from the phone. The result is a short, ranked list
// in the page's own words, grouped as the page groups it; the rest is only counted.
import { collectCandidates } from './collect';
import type { Candidate, IsVisible } from './collect';
import { containerOf, findModal, regionTypeOf, titleOf } from './group';
import type { RegionType } from './group';
import { formatOf, isPrimaryButton, mediaStateOf, nameOf, normalise, optionsOf, rangeOf, valueOf } from './describe';
import type { ControlRegistry } from './registry';
import { MAX_CONTROLS } from '../../shared/pageControlMessages';
import type { ControlGroup, ControlKind, PageControl, PageModel } from '../../shared/pageControlMessages';


const FALLBACK_NAMES: Partial<Record<ControlKind, string>> = {
  text: 'Text',
  multiline: 'Text',
  secret: 'Secret',
  number: 'Number',
  date: 'Date',
  choice: 'Choice',
  'multi-choice': 'Choices',
  toggle: 'Option',
  range: 'Slider',
};

const FIELD_KINDS = new Set<ControlKind>(['text', 'multiline', 'secret', 'number', 'date', 'choice', 'multi-choice', 'toggle', 'range']);

const REGION_SCORES: Record<RegionType, number> = {
  form: 40,
  fieldset: 40,
  dialog: 40,
  search: 35,
  media: 30,
  page: 10,
  aside: 0,
  nav: -10,
  header: -10,
  footer: -25,
};

interface Found {
  control: PageControl;
  element: Element;
  container: Element | null;
  region: RegionType;
  score: number;
  order: number;
}

const mediaName = (element: Element) =>
  normalise(element.getAttribute('aria-label')) || normalise(element.getAttribute('title')) || (element.tagName === 'VIDEO' ? 'Video' : 'Audio');

// Radio buttons with the same name are one choice.
const radioGroupKey = (input: HTMLInputElement) => `${input.form ? 'f' : 'd'}:${input.name}`;

const radioChoice = (radios: HTMLInputElement[]) => ({
  label: normalise(radios[0].closest('fieldset')?.querySelector('legend')?.textContent) || normalise(radios[0].getAttribute('aria-label')) || radios[0].name,
  options: radios.map(radio => ({ value: radio.value, label: nameOf(radio, 'toggle') || radio.value })),
  value: radios.find(radio => radio.checked)?.value,
});

const scoreOf = (kind: ControlKind, region: RegionType, primary: boolean, inFocusedForm: boolean) =>
  REGION_SCORES[region] +
  (FIELD_KINDS.has(kind) ? 20 : kind === 'media' ? 25 : kind === 'button' ? 10 : 0) +
  (primary ? 15 : 0) +
  (inFocusedForm ? 100 : 0);

export interface AnalyseOptions {
  visible: IsVisible;
  registry: ControlRegistry;
  maxControls?: number;
}

export const analysePage = (doc: Document, { visible, registry, maxControls = MAX_CONTROLS }: AnalyseOptions): PageModel => {
  const modal = findModal(doc, visible);
  let candidates: Candidate[] = collectCandidates(doc, visible);
  if (modal) candidates = candidates.filter(candidate => modal.contains(candidate.element));

  const focusedContainer = doc.activeElement && doc.activeElement !== doc.body ? containerOf(doc.activeElement) : null;
  const radios = new Map<string, HTMLInputElement[]>();
  const seenLinks = new Set<string>();
  const found: Found[] = [];

  candidates.forEach(({ element, kind }, order) => {
    if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'radio') {
      const key = radioGroupKey(element as HTMLInputElement);
      const group = radios.get(key);
      if (group) {
        group.push(element as HTMLInputElement);
        return;
      }
      radios.set(key, [element as HTMLInputElement]);
    }
    const container = kind === 'media' ? null : containerOf(element);
    const region: RegionType = kind === 'media' ? 'media' : regionTypeOf(container);
    let label = kind === 'media' ? mediaName(element) : nameOf(element, kind);
    if (kind === 'link') {
      const key = `${(element as HTMLAnchorElement).href}|${label}`;
      if (!label || seenLinks.has(key)) return;
      seenLinks.add(key);
    }
    if (!label && (kind === 'button' || kind === 'link')) return;
    label = label || FALLBACK_NAMES[kind] || 'Control';
    const primary = (kind === 'button' && isPrimaryButton(element)) || undefined;
    const control: PageControl = { id: registry.idFor(element), kind, label, ...(primary && { primary }) };
    const value = valueOf(element, kind);
    if (value !== undefined) control.value = value;
    if (kind === 'choice' || kind === 'multi-choice') control.options = optionsOf(element);
    if (kind === 'media') control.media = mediaStateOf(element);
    if (kind === 'date') {
      const format = formatOf(element);
      if (format) control.format = format;
    }
    if (kind === 'range') Object.assign(control, Object.fromEntries(Object.entries(rangeOf(element)).filter(([, v]) => v !== undefined)));
    const inFocusedForm = !!focusedContainer && container === focusedContainer;
    found.push({ control, element, container, region, score: scoreOf(kind, region, !!primary, inFocusedForm), order });
  });

  // Fill in radio groups now that all their buttons are known.
  for (const item of found) {
    const element = item.element as HTMLInputElement;
    if (element.tagName === 'INPUT' && element.type === 'radio') {
      const choice = radioChoice(radios.get(radioGroupKey(element)) || [element]);
      item.control.label = choice.label || item.control.label;
      item.control.options = choice.options;
      if (choice.value !== undefined) item.control.value = choice.value;
      else delete item.control.value;
    }
  }

  const ranked = [...found].sort((a, b) => b.score - a.score || a.order - b.order);
  const kept = ranked.slice(0, maxControls);
  const left = ranked.slice(maxControls);
  registry.keepOnly(new Set(kept.map(item => item.control.id)));

  // Groups in order of their best control; controls in page order.
  const groups = new Map<Element | string, { group: ControlGroup; best: number; first: number; items: Found[] }>();
  for (const item of kept) {
    const key = item.region === 'media' ? 'media' : item.container || 'page';
    let entry = groups.get(key);
    if (!entry) {
      entry = { group: { id: '', title: titleOf(item.region === 'media' ? null : item.container, item.region), controls: [] }, best: item.score, first: item.order, items: [] };
      groups.set(key, entry);
    }
    entry.best = Math.max(entry.best, item.score);
    entry.first = Math.min(entry.first, item.order);
    entry.items.push(item);
  }
  const titles = new Map<string, number>();
  const orderedGroups = Array.from(groups.values())
    .sort((a, b) => b.best - a.best || a.first - b.first)
    .map((entry, index) => {
      const seen = (titles.get(entry.group.title) || 0) + 1;
      titles.set(entry.group.title, seen);
      const title = seen > 1 ? `${entry.group.title} ${seen}` : entry.group.title;
      const labels = new Map<string, number>();
      const controls = entry.items
        .sort((a, b) => a.order - b.order)
        .map(item => {
          const count = (labels.get(item.control.label) || 0) + 1;
          labels.set(item.control.label, count);
          return count > 1 ? { ...item.control, label: `${item.control.label} (${count})` } : item.control;
        });
      return { id: `g${index + 1}`, title, controls };
    });

  return {
    host: doc.location.host,
    title: normalise(doc.title).slice(0, 80) || doc.location.host,
    scope: modal ? 'dialog' : 'page',
    groups: orderedGroups,
    more: {
      links: left.filter(item => item.control.kind === 'link').length,
      buttons: left.filter(item => item.control.kind === 'button').length,
      fields: left.filter(item => item.control.kind !== 'link' && item.control.kind !== 'button').length,
    },
  };
};
