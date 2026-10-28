// The connection QR code, with a right-click menu (and a button for keyboard users) that copies
// the code, so a Global Input App on this same device can connect by reading the clipboard.
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { ConnectQR } from 'global-input-react';
import type { GlobalInputData } from 'global-input-react';
import { Notice } from './components';
import { SmallButton } from './controls';
import { copyToClipboard } from '../tools/shared/pageInsert';
import type { ToolMessage } from '../tools/shared/pageInsert';
import { color, radius } from './theme';

const MENU_WIDTH = 180;

const Frame = styled.div`
  position: relative;
  align-self: center;
  padding: 12px;
  border: 1px solid ${color.line};
  border-radius: 12px;
  min-height: 200px;
  min-width: 200px;
`;

const Menu = styled.div`
  position: absolute;
  z-index: 10;
  width: ${MENU_WIDTH}px;
  padding: 4px;
  box-sizing: border-box;
  background: ${color.surface};
  border: 1px solid ${color.line};
  border-radius: ${radius.control};
  box-shadow: 0 6px 20px rgba(15, 26, 46, 0.16);
`;

const MenuItem = styled.button`
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  color: ${color.ink};
  text-align: left;
  cursor: pointer;
  &:hover,
  &:focus {
    background: ${color.infoBg};
    outline: none;
  }
`;

export const ConnectCode: React.FC<{ mobile: GlobalInputData }> = ({ mobile }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const [message, setMessage] = useState<ToolMessage>(null);
  const code = mobile.isReady ? mobile.connectionCode : '';

  // A new code (a new session) makes the last message stale.
  useEffect(() => setMessage(null), [code]);

  useEffect(() => {
    if (!menuAt) return;
    itemRef.current?.focus();
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event.type === 'mousedown' && itemRef.current?.contains(event.target as Node)) return;
      setMenuAt(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    window.addEventListener('blur', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
      window.removeEventListener('blur', close);
    };
  }, [menuAt]);

  const openMenu = (event: React.MouseEvent) => {
    if (!code || !frameRef.current) return;
    event.preventDefault();
    const box = frameRef.current.getBoundingClientRect();
    // Keep the menu inside the narrow panel.
    const x = Math.max(0, Math.min(event.clientX - box.left, document.documentElement.clientWidth - box.left - MENU_WIDTH - 8));
    setMenuAt({ x, y: event.clientY - box.top });
  };

  const copy = async () => {
    setMenuAt(null);
    const result = await copyToClipboard('the connection code', code);
    setMessage(result?.tone === 'success'
      ? { tone: 'success', text: 'Copied the connection code. Open the Global Input App on this device to connect.' }
      : { tone: 'warn', text: 'Could not copy the connection code. Scan the QR code instead.' });
  };

  return (
    <>
      <Frame ref={frameRef} onContextMenu={openMenu}>
        <ConnectQR mobile={mobile} size={200} label={null} />
        {menuAt && (
          <Menu role="menu" style={{ left: menuAt.x, top: menuAt.y }}>
            <MenuItem ref={itemRef} role="menuitem" onClick={copy}>
              Copy into Clipboard
            </MenuItem>
          </Menu>
        )}
      </Frame>
      <SmallButton style={{ alignSelf: 'center' }} disabled={!code} onClick={copy}>
        Copy code for an app on this device
      </SmallButton>
      {message && <Notice $tone={message.tone}>{message.text}</Notice>}
    </>
  );
};
