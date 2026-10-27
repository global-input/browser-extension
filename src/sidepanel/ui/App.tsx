import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ConnectQR } from 'global-input-react';
import { usePhoneConnection } from '../adapters/usePhoneConnection';
import { watchIdle } from '../adapters/idle';
import type { IdleReason } from '../adapters/idle';
import { IDLE_CHOICES, loadSettings, saveSettings } from '../adapters/settings';
import type { PanelSettings } from '../adapters/settings';
import { useSignIn } from '../useSignIn';
import { useSiteAccess } from '../adapters/siteAccess';
import { homeScreen } from '../core/phoneForms';
import { TOOLS, findTool } from '../tools/registry';
import { Tabs, ToolFrame, ToolList } from './tools';
import { SiteControls, SitesSection, TurnDetectionOn } from './siteSettings';
import type { PanelTab } from './tools';
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

const TOOL_ENTRIES = TOOLS.map(({ id, label }) => ({ id, label }));

export const App: React.FC = () => {
  const initialScreen = useMemo(() => homeScreen(TOOL_ENTRIES), []);
  const connection = usePhoneConnection(initialScreen);
  const [tab, setTab] = useState<PanelTab>('sign-in');
  const [openTool, setOpenTool] = useState<{ id: string; domain: string } | null>(null);
  const openToolRef = useRef<(toolId: string) => void>(() => undefined);
  const { view, skip, suspend, resume, saveAutoRule, detectionChanged } = useSignIn(connection, {
    list: () => TOOL_ENTRIES,
    open: toolId => openToolRef.current(toolId),
  });
  openToolRef.current = toolId => {
    if (!findTool(toolId)) {
      return;
    }
    suspend();
    setTab('tools');
    setOpenTool({ id: toolId, domain: view.host || '' });
  };
  const exitTool = () => {
    setOpenTool(null);
    connection.reclaim();
    resume();
  };
  const tool = openTool && findTool(openTool.id);

  // A sign-in request is what the user is waiting for: show it even from the Tools tab.
  useEffect(() => {
    if (view.phase === 'requesting') {
      setTab('sign-in');
    }
  }, [view.phase]);
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

  const siteAccess = useSiteAccess();

  const updateSettings = (next: PanelSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  return (
    <Shell>
      <Header connected={connected} />
      {!showSettings && !tool && <Tabs selected={tab} onSelect={setTab} />}
      <Body>
        {siteAccess.granted === false && !showSettings && <SiteAccessNotice onAllow={siteAccess.request} />}
        {showSettings ? (
          <SettingsView settings={settings} onChange={updateSettings} onClose={() => setShowSettings(false)} onSitesChanged={detectionChanged} />
        ) : tool && openTool ? (
          <ToolFrame tool={tool} domain={openTool.domain} onExit={exitTool} />
        ) : tab === 'tools' ? (
          <ToolList tools={TOOLS} onOpen={toolId => openToolRef.current(toolId)} />
        ) : connected ? (
          <ConnectedView view={view} actions={{ onSkip: skip, onSaveRule: saveAutoRule, onDetectionChanged: detectionChanged }} />
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

interface SiteActions {
  onSkip: () => void;
  onSaveRule: () => void;
  onDetectionChanged: () => void;
}

const ConnectedView: React.FC<{ view: SignInView; actions: SiteActions }> = ({ view, actions }) => {
  const recent = view.recent.map(item => ({ host: item.host, time: formatTime(item.at) }));
  return (
    <>
      {view.notice && view.phase === 'ready' && <Notice $tone="warn">{view.notice}</Notice>}
      <PhaseCard view={view} actions={actions} />
      <Recent items={recent} />
    </>
  );
};

const PhaseCard: React.FC<{ view: SignInView; actions: SiteActions }> = ({ view, actions }) => {
  const siteControls = view.host ? (
    <SiteControls
      host={view.host}
      canSaveRule={!!view.autoRule && view.phase === 'requesting'}
      onSaveRule={actions.onSaveRule}
      onDetectionChanged={actions.onDetectionChanged}
    />
  ) : null;
  if (view.textMode) {
    return (
      <Card aria-live="polite">
        <Title as="h2">Send text from your phone</Title>
        <Text>Click into the field on the page{view.host ? ` (${view.host})` : ''}, type the text or code on your phone, then tap Send.</Text>
        {view.textResult && <Notice $tone={view.textResult.ok ? 'success' : 'warn'}>{view.textResult.message}</Notice>}
      </Card>
    );
  }
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
          {view.phase !== 'signed-in' && <Button onClick={actions.onSkip}>Skip this page</Button>}
          {siteControls}
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
          <Text>The sign-in form on this page could not be read. A page rule can describe it: Tools, then Page control.</Text>
          {siteControls}
        </Card>
      );
    case 'detection-off':
      return (
        <Card>
          {view.host && <Site host={view.host} detail="Asks for a sign-in" />}
          <Text>Sign-in detection is off for this site, so nothing is sent to your phone.</Text>
          {view.host && <TurnDetectionOn host={view.host} onDetectionChanged={actions.onDetectionChanged} />}
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

const SiteAccessNotice: React.FC<{ onAllow: () => void }> = ({ onAllow }) => (
  <Notice $tone="warn" role="alert">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
      <span>
        <strong>Global Input cannot reach web pages.</strong> Its access to websites is turned off, so it cannot find sign-in forms or
        fill them. Allow it, then reload the pages you have open.
      </span>
      <Button type="button" onClick={onAllow}>
        Allow on all sites
      </Button>
    </div>
  </Notice>
);

const SettingsView: React.FC<{
  settings: PanelSettings;
  onChange: (settings: PanelSettings) => void;
  onClose: () => void;
  onSitesChanged: () => void;
}> = ({ settings, onChange, onClose, onSitesChanged }) => (
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
    <SitesSection onChanged={onSitesChanged} />
    <SectionLabel>Page rules</SectionLabel>
    <Text>Your own rules (Tools, then Page control) and the built-in ones are used first; other sign-in forms are found automatically.</Text>
    <Button onClick={onClose}>Done</Button>
  </>
);
