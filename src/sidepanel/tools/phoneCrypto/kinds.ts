// What makes encryption differ from decryption: wording, and the phone screens of the popup tool
// for each stage, so the phone sees exactly what it saw before. Decryption gets its own entry
// when it is restyled.
import type { MobileData } from 'global-input-mobile';
import * as inputOnComputer from '../../../app/mobile-encryption/provide-content/mobile-ui/onComputer';
import * as inputOnMobile from '../../../app/mobile-encryption/provide-content/mobile-ui/onMobile';
import * as resultOnComputer from '../../../app/mobile-encryption/result/mobile-ui/onComputer';
import * as resultOnMobile from '../../../app/mobile-encryption/result/mobile-ui/onMobile';

export interface InputScreenProps {
  initialContent: string;
  cancel: () => void;
  setContent: (content: string) => void;
  onTypeOnPhone: () => void;
  onStart: () => void;
}

export interface ResultScreenProps {
  result: string;
  restart: () => void;
  onShowOnPhone: () => void;
  finish: () => void;
}

export interface CryptoKind {
  // The phone's field that encrypts or decrypts (type 'encrypt' or 'decrypt').
  processField: { id: string; label: string; type: string; value: string };
  phoneTitle: string;
  // The id of the info line on the input screens, for messages to the phone.
  phoneInfoId: string;
  // The phone's text field on the 'mobile' input screen.
  phoneContentId: string;
  useInputOnComputer: (props: InputScreenProps) => MobileData;
  useInputOnMobile: (props: InputScreenProps) => MobileData;
  useResultOnComputer: (props: ResultScreenProps) => MobileData;
  useResultOnMobile: (props: ResultScreenProps) => MobileData;
  text: {
    inputLabel: string;
    inputPlaceholder: string;
    inputCaption: string;
    start: string;
    processingTitle: string;
    processingAction: string;
    resultLabel: string;
    resultCaption: string;
    restart: string;
    empty: string;
    failed: string;
  };
}

export const ENCRYPT: CryptoKind = {
  processField: { id: 'encryptContent', label: 'Content', type: 'encrypt', value: '' },
  phoneTitle: 'Mobile Encryption',
  phoneInfoId: inputOnComputer.FIELDS.info.id,
  phoneContentId: inputOnMobile.FIELDS.content.id,
  useInputOnComputer: ({ cancel, onTypeOnPhone, onStart }) =>
    inputOnComputer.useConnectMobile({ cancel, onContentOnMobile: onTypeOnPhone, onEncrypt: onStart }),
  useInputOnMobile: ({ initialContent, cancel, setContent, onStart }) =>
    inputOnMobile.useConnectMobile({ initialContent, cancel, setContent, onEncrypt: onStart }),
  useResultOnComputer: ({ restart, onShowOnPhone, finish }) =>
    resultOnComputer.useConnectMobile({ restart, onShowOnMobile: onShowOnPhone, finish }),
  useResultOnMobile: ({ result, restart, finish }) => resultOnMobile.useConnectMobile({ content: result, restart, finish }),
  text: {
    inputLabel: 'Content to encrypt',
    inputPlaceholder: 'Type or paste the text to encrypt',
    inputCaption: 'Your phone encrypts it with a key that stays on your phone, and sends back the result.',
    start: 'Encrypt on phone',
    processingTitle: 'Encrypting on your phone',
    processingAction: 'Encrypt',
    resultLabel: 'Encrypted content',
    resultCaption:
      'Store it wherever you like: only your phone can decrypt it. Keep a backup of the encryption key (export it from the app as an encrypted QR code), in case you lose your phone.',
    restart: 'Encrypt something else',
    empty: 'Please provide the content to encrypt using the application connected to your mobile app.',
    failed: 'Failed to encrypt!',
  },
};
