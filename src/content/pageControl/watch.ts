// Keeps the phone up with the page while Page control is open: after a change on the page (a
// dialog opening, the next step of a form, more content, a field the page filled in), the page
// is analysed again and the new model reported, only when it differs from the last one.
// Changes are checked at most every CHECK_MS, and not while the tab is hidden.
import type { PageModel } from '../../shared/pageControlMessages';

export const CHECK_MS = 400;

// Attributes that show, hide, enable or open controls.
const ATTRIBUTES = ['class', 'style', 'hidden', 'disabled', 'open', 'aria-hidden', 'aria-expanded', 'aria-modal', 'aria-disabled', 'inert', 'type'];

export interface WatcherOptions {
  doc: Document;
  analyse: () => PageModel;
  // Returns false when nobody listens any more, which stops watching.
  report: (model: PageModel) => Promise<boolean>;
}

export const createWatcher = ({ doc, analyse, report }: WatcherOptions) => {
  let observer: MutationObserver | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let last = '';
  const view = doc.defaultView;

  const check = async () => {
    timer = null;
    if (!observer || doc.hidden) return;
    const model = analyse();
    const key = JSON.stringify(model);
    if (key === last) return;
    last = key;
    if (!(await report(model))) stop();
  };

  // Soon, but not again before the pending check ran: a busy page still gets checked.
  const poke = () => {
    if (observer && !timer) timer = setTimeout(check, CHECK_MS);
  };

  const onVisible = () => {
    if (!doc.hidden) poke();
  };

  // Starts watching from the model the panel already has.
  const start = (current: PageModel) => {
    last = JSON.stringify(current);
    if (observer) return;
    observer = new MutationObserver(poke);
    observer.observe(doc.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
    doc.addEventListener('visibilitychange', onVisible);
    view?.addEventListener('popstate', poke);
    view?.addEventListener('hashchange', poke);
  };

  function stop() {
    observer?.disconnect();
    observer = null;
    if (timer) clearTimeout(timer);
    timer = null;
    doc.removeEventListener('visibilitychange', onVisible);
    view?.removeEventListener('popstate', poke);
    view?.removeEventListener('hashchange', poke);
  }

  return { start, stop, poke, isWatching: () => !!observer };
};
