import React, { useEffect, useRef, useState } from 'react';
import { ConnectQR } from 'global-input-react';
import { usePhoneConnection } from '../adapters/usePhoneConnection';
import { watchIdle } from '../adapters/idle';
import type { IdleReason } from '../adapters/idle';
import { IDLE_CHOICES, loadSettings, saveSettings } from '../adapters/settings';
import type { PanelSettings } from '../adapters/settings';
import { useSignIn } from '../useSignIn';
import type { SignInView } from '../core/signInController';
import { formatSeconds, formatTime, progressSteps, ruleSourceLabel } from './progress';
import {
  Body, Button, Card, Field, FooterBar, GearIcon, Header, IconButton, Notice, Progress, Recent, SectionLabel, Shell, Site, Text, Title,
} from './components';
import { color } from './theme';

const DISCONNECT_REASON: Record<IdleReason | 'manual', string> = {
  idle: 'Disconnected after a period of inactivity. Scan again to reconnect.',
  locked: 'Disconnected because the screen was locked. Scan again to reconnect.',
  manual: 'Disconnected. Scan again to reconnect.',
};

export const App: React.FC = () => {
  const connection = usePhoneConnection();
  const { view, skip } = useSignIn(connection);
  const [settings, setSettings] = useState<PanelSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState<string | null>(null);
  const connected = connection.status === 'connected';

  const joinable = useRef(false);
  joinable.current = connected || connection.canRejoin;
  const disconnectRef = useRef(connection.disconnect);
  disconnectRef.current = connection.disconnect;

  useEffect(
    () =>
      watchIdle(settings.idleMinutes, settings.disconnectOnLock, reason => {
        if (joinable.current) {
          setDisconnectReason(DISCONNECT_REASON[reason]);
        }
        disconnectRef.current();
      }),
    [settings.idleMinutes, settings.disconnectOnLock]
  );

  useEffect(() => {
    if (connected) {
      setDisconnectReason(null);
    }
  }, [connected]);

  const disconnect = () => {
    setDisconnectReason(DISCONNECT_REASON.manual);
    connection.disconnect();
  };

  const updateSettings = (next: PanelSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  return (
    <Shell>
      <Header connected={connected} />
      <Body>
        {showSettings ? (
          <SettingsView settings={settings} onChange={updateSettings} onClose={() => setShowSettings(false)} />
        ) : connected ? (
          <ConnectedView view={view} onSkip={skip} />
        ) : (
          <ConnectView connection={connection} notice={disconnectReason} />
        )}
      </Body>
      <FooterBar>
        <span>Disconnects after {settings.idleMinutes} min idle{settings.disconnectOnLock ? ' or on lock' : ''}</span>
        <span style={{ display: 'flex', gap: 8 }}>
          {connected && <Button onClick={disconnect}>Disconnect</Button>}
          <IconButton aria-label="Settings" aria-pressed={showSettings} onClick={() => setShowSettings(!showSettings)}>
            <GearIcon />
          </IconButton>
        </span>
      </FooterBar>
    </Shell>
  );
};

const ConnectView: React.FC<{ connection: ReturnType<typeof usePhoneConnection>; notice: string | null }> = ({ connection, notice }) => (
  <>
    {notice && <Notice $tone="warn">{notice}</Notice>}
    {connection.canRejoin && <Notice $tone="warn">Your phone dropped the connection. Rejoin from the app's history, or scan again.</Notice>}
    <Title>Connect your phone</Title>
    <Text>Scan once with the Global Input App. You stay connected while this panel is open.</Text>
    <div style={{ alignSelf: 'center', padding: 12, border: `1px solid ${color.line}`, borderRadius: 12, minHeight: 200, minWidth: 200 }}>
      <ConnectQR mobile={connection.mobile} size={200} label={null} />
    </div>
    {connection.status === 'error' && <Notice $tone="warn">Could not reach the Global Input service. {connection.errorMessage}</Notice>}
    <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, color: color.inkSoft }}>
      <li>Open the Global Input App on your phone</li>
      <li>Tap Scan and point at the code</li>
      <li>Sites you open ask your phone for the saved account</li>
    </ol>
  </>
);

const ConnectedView: React.FC<{ view: SignInView; onSkip: () => void }> = ({ view, onSkip }) => {
  const recent = view.recent.map(item => ({ host: item.host, time: formatTime(item.at) }));
  return (
    <>
      {view.notice && view.phase === 'ready' && <Notice $tone="warn">{view.notice}</Notice>}
      <PhaseCard view={view} onSkip={onSkip} />
      <Recent items={recent} />
    </>
  );
};

const PhaseCard: React.FC<{ view: SignInView; onSkip: () => void }> = ({ view, onSkip }) => {
  switch (view.phase) {
    case 'requesting':
    case 'submitted':
    case 'signed-in':
      return (
        <Card aria-live="polite">
          <Site host={view.host || ''} detail={ruleSourceLabel(view)} />
          <Progress steps={progressSteps(view)} />
          {view.notice && <Notice $tone="warn">{view.notice}</Notice>}
          {view.phase === 'signed-in' && <Notice $tone="success">Signed in in {formatSeconds(view.signedInMs)}</Notice>}
          {view.phase !== 'signed-in' && <Button onClick={onSkip}>Skip this page</Button>}
        </Card>
      );
    case 'unavailable':
      return (
        <Card>
          <Title as="h2">Not available on this tab</Title>
          <Text>Phone sign-in works on web pages. If this page was open before the extension was installed or updated, reload it.</Text>
        </Card>
      );
    case 'no-form':
      return (
        <Card>
          {view.host && <Site host={view.host} detail="Asks for a password" />}
          <Text>The sign-in form on this page could not be read. A page rule can describe it: open the extension popup and use Page Control.</Text>
        </Card>
      );
    case 'skipped':
      return (
        <Card>
          <Title as="h2">Skipped</Title>
          <Text>Nothing will be sent for this page. Reload it, or open another page, to sign in from your phone.</Text>
        </Card>
      );
    default:
      return (
        <Card>
          <Title as="h2">Ready</Title>
          <Text>Open any site. When a sign-in form appears, your phone gets the request automatically.</Text>
        </Card>
      );
  }
};

const SettingsView: React.FC<{ settings: PanelSettings; onChange: (settings: PanelSettings) => void; onClose: () => void }> = ({
  settings,
  onChange,
  onClose,
}) => (
  <>
    <Title>Settings</Title>
    <Field>
      Disconnect after idle
      <select value={settings.idleMinutes} onChange={event => onChange({ ...settings, idleMinutes: Number(event.target.value) })}>
        {IDLE_CHOICES.map(minutes => (
          <option key={minutes} value={minutes}>
            {minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hour${minutes > 60 ? 's' : ''}`}
          </option>
        ))}
      </select>
    </Field>
    <Field>
      Disconnect when the screen locks
      <input
        type="checkbox"
        checked={settings.disconnectOnLock}
        onChange={event => onChange({ ...settings, disconnectOnLock: event.target.checked })}
      />
    </Field>
    <SectionLabel>Page rules</SectionLabel>
    <Text>Built-in rules and your own rules from Page Control are used first; other sign-in forms are found automatically.</Text>
    <Button onClick={onClose}>Done</Button>
  </>
);
