// Opens the always-connected panel from the popup: Chrome's side panel, or Firefox's sidebar.
// Hidden where neither exists.
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const PanelButton = styled.button`
    position: fixed;
    top: 6px;
    left: 6px;
    z-index: 20;
    height: 26px;
    padding: 0 10px;
    border-radius: 13px;
    border: 1px solid #C5CDDB;
    background: #FFFFFF;
    color: #153E85;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    &:hover {
        background: #EEF3FF;
    }
`;

interface FirefoxSidebar {
    sidebarAction?: { open: () => Promise<void> };
}

const firefoxSidebar = () => (globalThis as unknown as { browser?: FirefoxSidebar }).browser?.sidebarAction;

export const OpenSidePanel: React.FC = () => {
    const [windowId, setWindowId] = useState<number | null>(null);
    useEffect(() => {
        if (window.chrome && chrome.sidePanel && chrome.windows) {
            chrome.windows.getCurrent().then(current => setWindowId(current.id ?? null));
        }
    }, []);
    const sidebar = firefoxSidebar();
    if (windowId === null && !sidebar) {
        return null;
    }
    // Opening must happen straight from the click, so the window id is looked up beforehand.
    const open = () => {
        const opened = windowId !== null ? chrome.sidePanel.open({ windowId }) : sidebar!.open();
        opened.then(() => window.close());
    };
    return (
        <PanelButton type="button" onClick={open} title="Stay connected and sign in to any site from your phone">
            Open side panel
        </PanelButton>
    );
};
