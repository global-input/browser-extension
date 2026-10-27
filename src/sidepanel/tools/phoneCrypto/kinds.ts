// What makes encryption differ from decryption: wording, and the phone screens of the popup tool
// for each stage, so the phone sees exactly what it saw before.
import type { MobileData } from 'global-input-mobile';
import * as inputOnComputer from '../../../app/mobile-encryption/provide-content/mobile-ui/onComputer';
import * as inputOnMobile from '../../../app/mobile-encryption/provide-content/mobile-ui/onMobile';
import * as resultOnComputer from '../../../app/mobile-encryption/result/mobile-ui/onComputer';
import * as resultOnMobile from '../../../app/mobile-encryption/result/mobile-ui/onMobile';
import * as decryptInputOnComputer from '../../../app/mobile-decryption/provide-content/mobile-ui/onComputer';
import * as decryptInputOnMobile from '../../../app/mobile-decryption/provide-content/mobile-ui/onMobile';
import * as decryptResultOnComputer from '../../../app/mobile-decryption/result/mobile-ui/onComputer';
import * as decryptResultOnMobile from '../../../app/mobile-decryption/result/mobile-ui/onMobile';
import encryptIcon from '../../../app/mobile-encryption/encrypt-content/images/encrypt-icon.png';
import decryptIcon from '../../../app/components/images/decrypt-icon.png';

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
  // The icon of the phone's encrypt or decrypt button, shown in the panel's steps.
  actionIcon: string;
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
  actionIcon: encryptIcon,
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

export const DECRYPT: CryptoKind = {
  processField: { id: 'decryptContent', label: 'Content', type: 'decrypt', value: '' },
  phoneTitle: 'Mobile Decryption',
  actionIcon: decryptIcon,
  phoneInfoId: decryptInputOnComputer.FIELDS.info.id,
  phoneContentId: decryptInputOnMobile.FIELDS.content.id,
  useInputOnComputer: ({ cancel, onTypeOnPhone, onStart }) =>
    decryptInputOnComputer.useConnectMobile({ cancel, onContentOnMobile: onTypeOnPhone, onDecrypt: onStart }),
  useInputOnMobile: ({ initialContent, cancel, setContent, onStart }) =>
    decryptInputOnMobile.useConnectMobile({ initialContent, cancel, setContent, onDecrypt: onStart }),
  useResultOnComputer: ({ restart, onShowOnPhone, finish }) =>
    decryptResultOnComputer.useConnectMobile({ restart, onShowOnMobile: onShowOnPhone, finish }),
  useResultOnMobile: ({ result, restart, finish }) => decryptResultOnMobile.useConnectMobile({ content: result, restart, finish }),
  text: {
    inputLabel: 'Content to decrypt',
    inputPlaceholder: 'Paste the encrypted text',
    inputCaption: 'Your phone decrypts it with the key that encrypted it, and sends back the result.',
    start: 'Decrypt on phone',
    processingTitle: 'Decrypting on your phone',
    processingAction: 'Decrypt',
    resultLabel: 'Decrypted content',
    resultCaption: 'As your phone sent it. It is not stored: it is gone when you press Done or close the panel.',
    restart: 'Decrypt something else',
    empty: 'Please provide the content to decrypt using the application connected to your mobile app.',
    failed: 'Failed to decrypt!',
  },
};
