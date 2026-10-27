// Content script entry: one listener for both the popup's page-control messages and the
// side panel's sign-in messages.
import { handleLegacyMessage } from './legacyProtocol';
import { createSignInAgent } from './signInAgent';
import { isSignInMessage } from '../shared/signInMessages';

const signInAgent = createSignInAgent();

chrome.runtime.onMessage.addListener((message, _sender, reply) => {
  if (!message) {
    reply({ messageType: 'error', status: 'error', host: window.location.host, content: 'empty' });
    return;
  }
  if (isSignInMessage(message.messageType)) {
    signInAgent.handle(message, reply);
  } else {
    handleLegacyMessage(message, reply);
  }
});

signInAgent.start();
