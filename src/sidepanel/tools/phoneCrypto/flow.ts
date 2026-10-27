// The steps of a phone encryption or decryption, as a pure state machine. The panel shows one
// view per stage; the phone shows the popup tool's screen for the same stage and screen.
//
// input       the content is typed in the panel, or also on the phone ('mobile' screen), or taken
//             from the focused field on the page (fromPage: the result can go back in its place)
// processing  the content is on the phone, which encrypts or decrypts it with a key it holds
// result      the phone sent the result back; it can also be shown on the phone

export type PhoneScreen = 'computer' | 'mobile';
export type CryptoError = 'empty' | 'failed';

export type CryptoState =
  | { stage: 'input'; content: string; phone: PhoneScreen; fromPage?: boolean; error?: CryptoError }
  | { stage: 'processing'; content: string; fromPage?: boolean; error?: CryptoError }
  | { stage: 'result'; result: string; phone: PhoneScreen; fromPage?: boolean };

export type CryptoEvent =
  | { type: 'edit'; content: string }
  | { type: 'from-page'; content: string }
  | { type: 'type-on-phone' }
  | { type: 'start' }
  | { type: 'back' }
  | { type: 'received'; result: string }
  | { type: 'show-on-phone' }
  | { type: 'restart' };

export const initialCryptoState: CryptoState = { stage: 'input', content: '', phone: 'computer' };

export const cryptoReducer = (state: CryptoState, event: CryptoEvent): CryptoState => {
  switch (state.stage) {
    case 'input':
      switch (event.type) {
        case 'edit':
          // Clearing the text forgets that it came from the page.
          return { ...state, content: event.content, fromPage: state.fromPage && !!event.content, error: undefined };
        case 'from-page':
          return { ...state, content: event.content, fromPage: true, error: undefined };
        case 'type-on-phone':
          return { ...state, phone: 'mobile' };
        case 'start': {
          const content = state.content.trim();
          return content ? { stage: 'processing', content, fromPage: state.fromPage } : { ...state, error: 'empty' };
        }
        default:
          return state;
      }
    case 'processing':
      switch (event.type) {
        case 'received':
          return event.result ? { stage: 'result', result: event.result, phone: 'computer', fromPage: state.fromPage } : { ...state, error: 'failed' };
        case 'back':
          return { stage: 'input', content: state.content, phone: 'computer', fromPage: state.fromPage };
        default:
          return state;
      }
    case 'result':
      switch (event.type) {
        case 'show-on-phone':
          return { ...state, phone: 'mobile' };
        case 'restart':
          return initialCryptoState;
        default:
          return state;
      }
  }
};
