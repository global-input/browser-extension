// The panel's tools: the popup's features, rendered unchanged. They call useMobile themselves;
// with the phone connected, that reuses the panel's connection (global-input-react sends the
// tool's screen to the phone instead of starting a new session).
// To add or remove a tool, change this list.
import React, { useState } from 'react';
import { MobileEncryption } from '../../app/mobile-encryption';
import { MobileDecryption } from '../../app/mobile-decryption';
import { PageControl } from '../../app/page-control';
import { EditRule } from '../../app/edit-rule';
import LoadFromPreset from '../../app/load-from-preset';
import { FormTransferTool } from './formTransfer/FormTransferTool';

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

const PageControlTool: React.FC<ToolProps> = ({ domain, exit }) => {
  const [page, setPage] = useState<{ name: 'control' | 'edit' | 'preset'; content?: string | null }>({ name: 'control' });
  const editRule = (content?: string) => setPage({ name: 'edit', content });
  switch (page.name) {
    case 'edit':
      return <EditRule back={exit} domain={domain} loadFromPreset={() => setPage({ name: 'preset' })} contentToEdit={page.content} />;
    case 'preset':
      return <LoadFromPreset editRule={editRule} domain={domain} />;
    default:
      return <PageControl back={exit} domain={domain} editRule={editRule} />;
  }
};

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
    Component: ({ domain, exit }) => <MobileEncryption domain={domain} back={exit} />,
  },
  {
    id: 'mobile-decryption',
    label: 'Decryption',
    title: 'Decrypt',
    description: 'Decrypt content with a key kept on your phone.',
    Component: ({ domain, exit }) => <MobileDecryption domain={domain} back={exit} />,
  },
  {
    id: 'page-control',
    label: 'Page Control',
    title: 'Page control',
    description: 'Operate this page from your phone with a page rule.',
    Component: PageControlTool,
  },
];

export const findTool = (id: string | null) => TOOLS.find(tool => tool.id === id) || null;
