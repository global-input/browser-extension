// Opens the always-connected side panel from the popup. Hidden where the browser has no
// side panel API (Firefox, Chrome before 116).
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

export const OpenSidePanel: React.FC = () => {
    const [windowId, setWindowId] = useState<number | null>(null);
    useEffect(() => {
        if (window.chrome && chrome.sidePanel && chrome.windows) {
            chrome.windows.getCurrent().then(current => setWindowId(current.id ?? null));
        }
    }, []);
    if (windowId === null) {
        return null;
    }
    // Opening must happen straight from the click, so the window id is looked up beforehand.
    const open = () => {
        chrome.sidePanel.open({ windowId }).then(() => window.close());
    };
    return (
        <PanelButton type="button" onClick={open} title="Stay connected and sign in to any site from your phone">
            Open side panel
        </PanelButton>
    );
};
