// Keeps the phone up with the page while Page control is open: after a change on the page (a
// dialog opening, the next step of a form, more content, a field the page filled in, a video
// paused), the page is analysed again and the new model reported, only when it differs from the
// last one. Frames from the same site are watched too.
// Changes are checked at most every CHECK_MS, and not while the tab is hidden.
import { sameSiteFrames } from './collect';
import type { PageModel } from '../../shared/pageControlMessages';

export const CHECK_MS = 400;

// Attributes that show, hide, enable or open controls.
const ATTRIBUTES = ['class', 'style', 'hidden', 'disabled', 'open', 'aria-hidden', 'aria-expanded', 'aria-modal', 'aria-disabled', 'inert', 'type'];

// Media events don't bubble, but reach the document while capturing.
const MEDIA_EVENTS = ['play', 'pause', 'ended', 'volumechange', 'durationchange', 'seeked'];

// A playing video's position changes every second; on its own it isn't a change worth
// reporting. It goes with the next report, for example on pause.
const keyOf = (model: PageModel) =>
  JSON.stringify(model, (name, value) => (name === 'position' ? undefined : value));

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
  const watched = new Set<Document>();

  // The page and the frames from the same site, including frames added since the last check.
  const watchDocuments = () => {
    const documents = [doc, ...sameSiteFrames(doc).map(frame => frame.contentDocument!)];
    for (const each of documents) {
      if (watched.has(each) || !observer) continue;
      watched.add(each);
      observer.observe(each.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
      MEDIA_EVENTS.forEach(type => each.addEventListener(type, poke, true));
    }
  };

  const check = async () => {
    timer = null;
    if (!observer || doc.hidden) return;
    watchDocuments();
    const model = analyse();
    const key = keyOf(model);
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
    last = keyOf(current);
    if (observer) return;
    observer = new MutationObserver(poke);
    watchDocuments();
    doc.addEventListener('visibilitychange', onVisible);
    view?.addEventListener('popstate', poke);
    view?.addEventListener('hashchange', poke);
  };

  function stop() {
    observer?.disconnect();
    observer = null;
    watched.forEach(each => MEDIA_EVENTS.forEach(type => each.removeEventListener(type, poke, true)));
    watched.clear();
    if (timer) clearTimeout(timer);
    timer = null;
    doc.removeEventListener('visibilitychange', onVisible);
    view?.removeEventListener('popstate', poke);
    view?.removeEventListener('hashchange', poke);
  }

  return { start, stop, poke, isWatching: () => !!observer };
};
