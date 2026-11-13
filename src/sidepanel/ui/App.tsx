import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePhoneConnection, useServiceRetry } from '../adapters/usePhoneConnection';
import type { PhoneConnection } from '../adapters/usePhoneConnection';
import type { SessionStore } from '../adapters/sessionStore';
import { useSignIn } from '../useSignIn';
import { useSiteAccess } from '../adapters/siteAccess';
import { homeScreen } from '../core/phoneForms';
import { TOOLS, findTool } from '../tools/registry';
import { Tabs, ToolFrame, ToolList } from './tools';
import { ConnectCode } from './connectCode';
import { WaitingView } from './waitingView';
import { AdvancedSettings, useConnectionRecord } from './advancedSettings';
import { isPrivatelyPaired } from 'global-input-mobile';
import { SiteControls, SitesSection, TurnDetectionOn } from './siteSettings';
import type { PanelTab } from './tools';
import type { SignInView } from '../core/signInController';
import { formatSeconds, formatTime, progressSteps, ruleSourceLabel } from './progress';
import {
  Body, Button, Card, FooterBar, GearIcon, Header, IconButton, Notice, Progress, Recent, SectionLabel, Shell, Site, Text, Title,
} from './components';
import { color } from './theme';

const RESET_NOTICE = 'New connection. The previous session can no longer be used. Scan this code to connect.';

const TOOL_ENTRIES = TOOLS.map(({ id, label }) => ({ id, label }));

export const App: React.FC<{ sessionStore: SessionStore }> = ({ sessionStore }) => {
  const initialScreen = useMemo(() => homeScreen(TOOL_ENTRIES), []);
  const connection = usePhoneConnection(initialScreen, sessionStore);
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
  const [showSettings, setShowSettings] = useState(false);
  const { phase } = connection;
  const connected = phase === 'connected';

  // Keep the same session through network failures; paused while a tool owns the connection.
  useServiceRetry(connection.service, !openTool, connection.reclaim);

  // Reset while connected asks once; on the waiting screen it acts at once (the line under the
  // button explains it). Pressing End session on the phone resets without asking.
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const reset = () => {
    setConfirmingReset(false);
    setResetNotice(RESET_NOTICE);
    connection.reset();
  };
  useEffect(() => {
    if (phase !== 'connected') setConfirmingReset(false);
    if (phase !== 'fresh') setResetNotice(null);
  }, [phase]);

  const siteAccess = useSiteAccess();

  return (
    <Shell>
      <Header phase={phase} />
      {!showSettings && !tool && <Tabs selected={tab} onSelect={setTab} />}
      <Body>
        {siteAccess.granted === false && !showSettings && <SiteAccessNotice onAllow={siteAccess.request} />}
        {showSettings ? (
          <SettingsView onClose={() => setShowSettings(false)} onSitesChanged={detectionChanged} />
        ) : tool && openTool ? (
          <ToolFrame tool={tool} domain={openTool.domain} onExit={exitTool} />
        ) : tab === 'tools' ? (
          <ToolList tools={TOOLS} onOpen={toolId => openToolRef.current(toolId)} />
        ) : connected ? (
          <ConnectedView view={view} actions={{ onSkip: skip, onSaveRule: saveAutoRule, onDetectionChanged: detectionChanged }} />
        ) : phase === 'waiting' ? (
          <WaitingView connection={connection} onReset={reset} keptWhileClosed={sessionStore.owner} />
        ) : (
          <ConnectView connection={connection} notice={resetNotice} keptWhileClosed={sessionStore.owner} />
        )}
      </Body>
      {confirmingReset && (
        <Notice $tone="warn" role="alertdialog" aria-label="End this session" style={{ margin: '0 16px 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
            <span>End this session? Your phone will need to scan again.</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <Button type="button" onClick={reset}>
                End session
              </Button>
              <Button type="button" onClick={() => setConfirmingReset(false)}>
                Cancel
              </Button>
            </span>
          </div>
        </Notice>
      )}
      <FooterBar>
        <span />
        <span style={{ display: 'flex', gap: 8 }}>
          {connected && !confirmingReset && <Button onClick={() => setConfirmingReset(true)}>Reset</Button>}
          {phase === 'waiting' && (showSettings || tool || tab === 'tools') && <Button onClick={reset}>Reset</Button>}
          <IconButton aria-label="Settings" aria-pressed={showSettings} onClick={() => setShowSettings(!showSettings)}>
            <GearIcon />
          </IconButton>
        </span>
      </FooterBar>
    </Shell>
  );
};

const ConnectView: React.FC<{ connection: PhoneConnection; notice: string | null; keptWhileClosed: boolean }> = ({
  connection,
  notice,
  keptWhileClosed,
}) => {
  const paired = isPrivatelyPaired(useConnectionRecord());
  return (
  <>
    {notice && <Notice $tone="info">{notice}</Notice>}
    <Title>Connect your phone</Title>
    <Text>
      Scan once with the Global Input App. If your phone drops the connection, it can come back from the app's History without
      scanning, until you press Reset{keptWhileClosed ? ' or quit the browser' : ' or close this panel'}.
    </Text>
    <ConnectCode mobile={connection.mobile} />
    {connection.service === 'error' && (
      <Notice $tone="warn">Could not reach the Global Input service. Trying again… {connection.errorMessage}</Notice>
    )}
    <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, color: color.inkSoft }}>
      <li>Open the Global Input App on your phone</li>
      <li>Tap Scan and point at the code</li>
      <li>Sites you open ask your phone for the saved account</li>
    </ol>
    {paired && (
      <Text style={{ fontSize: 12 }}>
        <strong>Private pairing:</strong> only phones paired with this browser can read this code. If your phone shows
        "QR Code Content" or a Security Group Key mismatch, pair it again in Settings, Advanced.
      </Text>
    )}
  </>
  );
};

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
  onClose: () => void;
  onSitesChanged: () => void;
}> = ({ onClose, onSitesChanged }) => (
  <>
    <Title>Settings</Title>
    <SitesSection onChanged={onSitesChanged} />
    <SectionLabel>Page rules</SectionLabel>
    <Text>
      Sign-in uses a form you saved for the site (Save as page rule, under Site settings on the sign-in card); otherwise it finds sign-in forms
      automatically. Saved forms are listed under Sites, where you can forget them.
    </Text>
    <AdvancedSettings />
    <Button onClick={onClose}>Done</Button>
  </>
);
