// Content script entry: one listener for the popup's page-control messages and the side
// panel's sign-in and Page control messages.
import { handleLegacyMessage } from './legacyProtocol';
import { createSignInAgent } from './signInAgent';
import { createPageControlAgent } from './pageControl/agent';
import { isSignInMessage } from '../shared/signInMessages';
import { isPageControlMessage } from '../shared/pageControlMessages';

const signInAgent = createSignInAgent();
const pageControlAgent = createPageControlAgent();

chrome.runtime.onMessage.addListener((message, _sender, reply) => {
  if (!message) {
    reply({ messageType: 'error', status: 'error', host: window.location.host, content: 'empty' });
    return;
  }
  if (isSignInMessage(message.messageType)) {
    signInAgent.handle(message, reply);
  } else if (isPageControlMessage(message.messageType)) {
    pageControlAgent.handle(message, reply);
  } else {
    handleLegacyMessage(message, reply);
  }
});

signInAgent.start();
