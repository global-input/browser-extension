// The messages the popup sends to the page (src/app/chrome-extension). The replies are the
// same as the original public/content.js gave.
import { buildPageForm, setFieldValue, toMobileForm } from './formBuilder';
import type { PageForm } from './formBuilder';

export const LEGACY_MESSAGE_TYPES = ['set-key', 'get-page-config', 'next-page-config', 'set-form-field', 'reset', 'check-page-status'];

interface LegacyMessage {
  messageType: string;
  content?: any;
}

const pageData: { key: string | null; pageForm: PageForm | null } = { key: null, pageForm: null };

export const handleLegacyMessage = (message: LegacyMessage, reply: (response: object) => void) => {
  const host = window.location.host;
  const { messageType } = message;
  switch (messageType) {
    case 'set-key':
      pageData.key = message.content.key;
      reply({ messageType, status: 'success', host, content: null });
      break;
    case 'get-page-config':
    case 'next-page-config': {
      pageData.pageForm = buildPageForm(message.content && message.content.applicationControlConfig);
      if (!pageData.pageForm) {
        reply({ messageType, host, status: 'failed', content: 'no recognized form' });
      } else {
        reply({ messageType, host, status: 'success', content: { host, form: toMobileForm(pageData.pageForm) } });
      }
      break;
    }
    case 'set-form-field':
      if (!pageData.pageForm) {
        reply({ messageType, host, status: 'error', content: 'no form in the page' });
        return;
      }
      setFieldValue(pageData.pageForm, message.content.fieldId, message.content.fieldValue);
      reply({ messageType, host, status: 'success' });
      break;
    case 'reset':
      pageData.pageForm = null;
      pageData.key = null;
      reply({ messageType, host, status: 'success' });
      break;
    case 'check-page-status':
      reply({ messageType, host, status: 'success', content: { key: pageData.key } });
      break;
    default:
      reply({ messageType, host, status: 'error', content: 'messageType not recognized' });
  }
};
