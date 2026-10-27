// The Tools tab: the list of tools, and the frame a running tool is shown in.
import React from 'react';
import styled from 'styled-components';
import type { ToolDefinition } from '../tools/registry';
import { Button, Notice } from './components';
import { color, radius } from './theme';

const ToolButton = styled.button`
  text-align: left;
  padding: 12px 14px;
  border: 1px solid ${color.line};
  border-radius: ${radius.card};
  background: ${color.surface};
  font: inherit;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  &:hover {
    border-color: ${color.primary};
  }
  &:focus-visible {
    outline: 2px solid ${color.primary};
    outline-offset: 2px;
  }
`;

export const ToolList: React.FC<{ tools: ToolDefinition[]; onOpen: (id: string) => void }> = ({ tools, onOpen }) => (
  <>
    {tools.map(tool => (
      <ToolButton key={tool.id} type="button" onClick={() => onOpen(tool.id)}>
        <span style={{ fontSize: 14, fontWeight: 600, color: color.ink }}>{tool.title}</span>
        <span style={{ fontSize: 12, color: color.muted, lineHeight: 1.45 }}>{tool.description}</span>
      </ToolButton>
    ))}
  </>
);

export const ToolFrame: React.FC<{ tool: ToolDefinition; domain: string; onExit: () => void }> = ({ tool, domain, onExit }) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Button type="button" onClick={onExit}>
        Back to tools
      </Button>
      <span style={{ fontWeight: 600 }}>{tool.title}</span>
    </div>
    <Notice $tone="info">Sign-in requests are paused while a tool is open.</Notice>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <tool.Component domain={domain} exit={onExit} />
    </div>
  </>
);

const TabList = styled.div`
  display: flex;
  gap: 4px;
  margin: 12px 16px 0;
  padding: 4px;
  border-radius: 10px;
  background: ${color.neutralBg};
`;

const Tab = styled.button<{ $selected: boolean }>`
  flex: 1;
  height: 32px;
  border: none;
  border-radius: ${radius.control};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  color: ${color.ink};
  background: ${p => (p.$selected ? color.surface : 'transparent')};
  box-shadow: ${p => (p.$selected ? '0 1px 2px rgba(15, 26, 46, 0.12)' : 'none')};
  &:focus-visible {
    outline: 2px solid ${color.primary};
  }
`;

export type PanelTab = 'sign-in' | 'tools';

export const Tabs: React.FC<{ selected: PanelTab; onSelect: (tab: PanelTab) => void }> = ({ selected, onSelect }) => (
  <TabList role="tablist" aria-label="Panel sections">
    <Tab type="button" role="tab" aria-selected={selected === 'sign-in'} $selected={selected === 'sign-in'} onClick={() => onSelect('sign-in')}>
      Sign in
    </Tab>
    <Tab type="button" role="tab" aria-selected={selected === 'tools'} $selected={selected === 'tools'} onClick={() => onSelect('tools')}>
      Tools
    </Tab>
  </TabList>
);
