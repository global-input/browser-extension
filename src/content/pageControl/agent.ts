// The page's side of Page control: answers the panel's requests, only for the host the panel
// expects, so nothing is analysed or touched after the tab moved to another site. From an
// analysis until the panel stops it, changes on the page are reported to the panel.
import { analysePage } from './analyse';
import { highlightElement } from './highlight';
import { actOn, doPageAction } from './act';
import { createWatcher } from './watch';
import { createRegistry } from './registry';
import { isVisible } from '../autoDetect';
import type { IsVisible } from './collect';
import { MAX_CONTROLS, MAX_CONTROLS_LIMIT, PAGE_CONTROL_MESSAGE } from '../../shared/pageControlMessages';
import type {
  PageModel,
  ActReply,
  ActRequest,
  AnalyseReply,
  AnalyseRequest,
  HighlightReply,
  HighlightRequest,
  PageActionReply,
  PageActionRequest,
} from '../../shared/pageControlMessages';

const reportToPanel = async (model: PageModel) => {
  try {
    const reply = await chrome.runtime.sendMessage({ messageType: PAGE_CONTROL_MESSAGE.CHANGED, content: { model } });
    return !!reply && reply.status === 'ok';
  } catch (error) {
    // The panel was closed, or the extension reloaded while this page stayed open.
    return false;
  }
};

export const createPageControlAgent = (
  doc: Document = document,
  visible: IsVisible = isVisible,
  report: (model: PageModel) => Promise<boolean> = reportToPanel
) => {
  const registry = createRegistry();
  // The panel's limit ("Show more") also applies when the page is analysed again by itself.
  let maxControls = MAX_CONTROLS;
  const watcher = createWatcher({ doc, analyse: () => analysePage(doc, { visible, registry, maxControls }), report });

  const analyse = ({ expectedHost, limit }: AnalyseRequest): AnalyseReply => {
    if (doc.location.host !== expectedHost) return { status: 'error', reason: 'host-mismatch' };
    maxControls = Number.isInteger(limit) ? Math.max(1, Math.min(MAX_CONTROLS_LIMIT, limit as number)) : MAX_CONTROLS;
    const model = analysePage(doc, { visible, registry, maxControls });
    watcher.start(model);
    return { status: 'success', model };
  };

  const highlight = ({ expectedHost, id }: HighlightRequest): HighlightReply => {
    if (doc.location.host !== expectedHost) return { status: 'error', reason: 'host-mismatch' };
    const element = registry.find(id);
    if (!element) return { status: 'error', reason: 'gone' };
    highlightElement(element, doc);
    return { status: 'success' };
  };

  // Only controls of the latest analysis can be operated, and only while still on the page.
  const act = ({ expectedHost, id, value, media }: ActRequest): ActReply => {
    if (doc.location.host !== expectedHost) return { status: 'error', reason: 'host-mismatch' };
    const element = registry.find(id);
    if (!element) return { status: 'error', reason: 'gone' };
    // The page may react to the input (fill in other fields, show the next step).
    watcher.poke();
    return actOn(element, value, media);
  };

  const pageAction = ({ expectedHost, action }: PageActionRequest): PageActionReply => {
    if (doc.location.host !== expectedHost) return { status: 'error', reason: 'host-mismatch' };
    doPageAction(action, doc);
    watcher.poke();
    return { status: 'success' };
  };

  const handle = (message: { messageType: string; content?: any }, reply: (response: object) => void) => {
    switch (message.messageType) {
      case PAGE_CONTROL_MESSAGE.ANALYSE:
        reply(analyse(message.content || {}));
        break;
      case PAGE_CONTROL_MESSAGE.HIGHLIGHT:
        reply(highlight(message.content || {}));
        break;
      case PAGE_CONTROL_MESSAGE.ACT:
        reply(act(message.content || {}));
        break;
      case PAGE_CONTROL_MESSAGE.PAGE_ACTION:
        reply(pageAction(message.content || {}));
        break;
      case PAGE_CONTROL_MESSAGE.STOP:
        watcher.stop();
        reply({ status: 'success' });
        break;
      default:
        reply({ status: 'error', reason: 'unknown-message' });
    }
  };

  return { handle, analyse, highlight, act, pageAction, stop: watcher.stop, isWatching: watcher.isWatching };
};
