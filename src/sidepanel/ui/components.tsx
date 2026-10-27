// Presentational building blocks of the side panel. No connection or Chrome code here.
import React from 'react';
import styled from 'styled-components';
import { color, font, radius } from './theme';
import type { Step } from './progress';

export const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${color.surface};
  color: ${color.ink};
  font-family: ${font.ui};
  font-size: 13px;
`;

const HeaderBar = styled.header`
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${color.lineSoft};
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: ${font.brand};
  font-weight: 600;
  font-size: 17px;
  color: ${color.brand};
`;

const Logo = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="24" height="24" rx="7" fill={color.brand} />
    <circle cx="9" cy="13" r="3" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="17" cy="13" r="3" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M12 13h2" stroke="#FFFFFF" strokeWidth="2" />
  </svg>
);

const Pill = styled.span<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: ${radius.pill};
  background: ${p => (p.$on ? color.successBg : color.neutralBg)};
  color: ${p => (p.$on ? color.successInk : color.inkSoft)};
  font-size: 12px;
  font-weight: 600;
`;

const Dot = styled.span<{ $on: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: ${p => (p.$on ? color.success : color.neutralDot)};
`;

export const Header: React.FC<{ connected: boolean }> = ({ connected }) => (
  <HeaderBar>
    <Brand>
      <Logo />
      Global Input
    </Brand>
    <Pill $on={connected} role="status">
      <Dot $on={connected} />
      {connected ? 'Connected' : 'Not connected'}
    </Pill>
  </HeaderBar>
);

export const Body = styled.main`
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const Card = styled.section`
  border: 1px solid ${color.line};
  border-radius: ${radius.card};
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
`;

export const Text = styled.p`
  margin: 0;
  color: ${color.muted};
  line-height: 1.5;
`;

const NOTICE_TONES = {
  warn: { background: color.warnBg, ink: color.warnInk },
  success: { background: color.successBg, ink: color.successInk },
  info: { background: color.infoBg, ink: color.brand },
};

export const Notice = styled.div<{ $tone: keyof typeof NOTICE_TONES }>`
  padding: 10px 12px;
  border-radius: ${radius.control};
  background: ${p => NOTICE_TONES[p.$tone].background};
  color: ${p => NOTICE_TONES[p.$tone].ink};
  line-height: 1.45;
  font-weight: ${p => (p.$tone === 'success' ? 500 : 400)};
`;

export const Button = styled.button`
  height: 36px;
  padding: 0 14px;
  border-radius: ${radius.control};
  border: 1px solid ${color.control};
  background: ${color.surface};
  color: ${color.ink};
  font: inherit;
  cursor: pointer;
  &:hover {
    background: ${color.canvas};
  }
  &:focus-visible {
    outline: 2px solid ${color.primary};
    outline-offset: 2px;
  }
`;

export const IconButton = styled(Button)`
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const SectionLabel = styled.h2`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${color.muted};
`;

const SiteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Favicon = styled.span`
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: ${radius.control};
  background: ${color.brand};
  color: #ffffff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
`;

export const Site: React.FC<{ host: string; detail: string }> = ({ host, detail }) => (
  <SiteRow>
    <Favicon aria-hidden="true">{host.replace(/^www\./, '').charAt(0)}</Favicon>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, wordBreak: 'break-all' }}>{host}</div>
      <div style={{ fontSize: 12, color: color.muted }}>{detail}</div>
    </div>
  </SiteRow>
);

const StepList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StepItem = styled.li<{ $state: Step['state'] }>`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${p => (p.$state === 'todo' ? color.muted : color.ink)};
  font-weight: ${p => (p.$state === 'current' ? 600 : 400)};
`;

const StepMark = styled.span<{ $state: Step['state'] }>`
  width: 20px;
  height: 20px;
  flex: none;
  box-sizing: border-box;
  border-radius: 10px;
  border: 2px solid ${p => (p.$state === 'done' ? color.success : p.$state === 'current' ? color.primary : color.control)};
  background: ${p => (p.$state === 'done' ? color.success : color.surface)};
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Progress: React.FC<{ steps: Step[] }> = ({ steps }) => (
  <StepList>
    {steps.map(step => (
      <StepItem key={step.label} $state={step.state}>
        <StepMark $state={step.state}>
          {step.state === 'done' && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" aria-hidden="true">
              <path d="M4 12l5 5L20 6" />
            </svg>
          )}
        </StepMark>
        <span>
          {step.label}
          {step.state === 'done' && <span className="visually-hidden"> (done)</span>}
        </span>
      </StepItem>
    ))}
  </StepList>
);

const RecentRow = styled.li`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${color.lineSoft};
`;

export const Recent: React.FC<{ items: { host: string; time: string }[] }> = ({ items }) =>
  items.length ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <SectionLabel>Recent</SectionLabel>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map(item => (
          <RecentRow key={`${item.host}-${item.time}`}>
            <span>{item.host}</span>
            <span style={{ color: color.muted }}>{item.time}</span>
          </RecentRow>
        ))}
      </ul>
    </div>
  ) : null;

export const FooterBar = styled.footer`
  padding: 12px 16px;
  border-top: 1px solid ${color.lineSoft};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: ${color.muted};
  font-size: 12px;
`;

export const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.inkSoft} strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const Field = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 500;
  select {
    height: 34px;
    border-radius: ${radius.control};
    border: 1px solid ${color.control};
    padding: 0 8px;
    font: inherit;
    background: ${color.surface};
  }
  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: ${color.primary};
  }
`;
