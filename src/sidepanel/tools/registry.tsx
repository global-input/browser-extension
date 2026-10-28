// The panel's tools. Each lives under ./<tool>/ and reuses the popup tool's phone screens, so the
// phone sees no change. They call useMobile themselves;
// with the phone connected, that reuses the panel's connection (global-input-react sends the
// tool's screen to the phone instead of starting a new session).
// To add or remove a tool, change this list.
import React from 'react';
import { FormTransferTool } from './formTransfer/FormTransferTool';
import { PhoneCryptoTool } from './phoneCrypto/PhoneCryptoTool';
import { DECRYPT, ENCRYPT } from './phoneCrypto/kinds';
import { PageAnalyseTool } from './pageControl/AnalyseTool';

export interface ToolProps {
  // Host of the active tab when the tool was opened.
  domain: string;
  exit: () => void;
}

export interface ToolDefinition {
  id: string;
  // Button label on the phone's home screen.
  label: string;
  title: string;
  description: string;
  Component: React.FC<ToolProps>;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'form-data-transfer',
    label: 'Transfer Form Data',
    title: 'Transfer form data',
    description: 'Send text or form values between your phone and this computer.',
    Component: FormTransferTool,
  },
  {
    id: 'mobile-encryption',
    label: 'Encryption',
    title: 'Encrypt',
    description: 'Encrypt content with a key kept on your phone.',
    Component: props => <PhoneCryptoTool {...props} kind={ENCRYPT} />,
  },
  {
    id: 'mobile-decryption',
    label: 'Decryption',
    title: 'Decrypt',
    description: 'Decrypt content with a key kept on your phone.',
    Component: props => <PhoneCryptoTool {...props} kind={DECRYPT} />,
  },
  {
    id: 'page-control',
    label: 'Page Control',
    title: 'Page control',
    description: 'Operate this page from your phone. The page is analysed for what can be operated.',
    Component: PageAnalyseTool,
  },
];

export const findTool = (id: string | null) => TOOLS.find(tool => tool.id === id) || null;
