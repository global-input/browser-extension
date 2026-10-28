// The page's side of Page control: answers the panel's requests, only for the host the panel
// expects, so nothing is analysed or touched after the tab moved to another site.
import { analysePage } from './analyse';
import { highlightElement } from './highlight';
import { actOn, doPageAction } from './act';
import { createRegistry } from './registry';
import { isVisible } from '../autoDetect';
import type { IsVisible } from './collect';
import { PAGE_CONTROL_MESSAGE } from '../../shared/pageControlMessages';
import type {
  ActReply,
  ActRequest,
  AnalyseReply,
  AnalyseRequest,
  HighlightReply,
  HighlightRequest,
  PageActionReply,
  PageActionRequest,
} from '../../shared/pageControlMessages';

export const createPageControlAgent = (doc: Document = document, visible: IsVisible = isVisible) => {
  const registry = createRegistry();

  const analyse = ({ expectedHost }: AnalyseRequest): AnalyseReply =>
    doc.location.host !== expectedHost
      ? { status: 'error', reason: 'host-mismatch' }
      : { status: 'success', model: analysePage(doc, { visible, registry }) };

  const highlight = ({ expectedHost, id }: HighlightRequest): HighlightReply => {
    if (doc.location.host !== expectedHost) return { status: 'error', reason: 'host-mismatch' };
    const element = registry.find(id);
    if (!element) return { status: 'error', reason: 'gone' };
    highlightElement(element, doc);
    return { status: 'success' };
  };

  // Only controls of the latest analysis can be operated, and only while still on the page.
  const act = ({ expectedHost, id, value }: ActRequest): ActReply => {
    if (doc.location.host !== expectedHost) return { status: 'error', reason: 'host-mismatch' };
    const element = registry.find(id);
    return element ? actOn(element, value) : { status: 'error', reason: 'gone' };
  };

  const pageAction = ({ expectedHost, action }: PageActionRequest): PageActionReply => {
    if (doc.location.host !== expectedHost) return { status: 'error', reason: 'host-mismatch' };
    doPageAction(action, doc);
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
      default:
        reply({ status: 'error', reason: 'unknown-message' });
    }
  };

  return { handle, analyse, highlight, act, pageAction };
};
