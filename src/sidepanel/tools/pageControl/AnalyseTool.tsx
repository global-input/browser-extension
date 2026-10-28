// Page control without presets or rules: the page is analysed when the tool opens (and again
// on request). The panel lists what can be operated, grouped as the page groups it, with Locate
// to outline a control on the page; the phone gets the same controls and operates them.
// Values are never shown in the panel.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useMobile } from 'global-input-mobile';
import type { InitData } from 'global-input-react';
import { actOnActivePage, analyseActivePage, highlightOnActivePage, pageActionOnActivePage } from '../../adapters/chromePage';
import { Card, Notice, SectionLabel, Site, Text } from '../../ui/components';
import { Caption, PrimaryButton, Row, SmallButton } from '../../ui/controls';
import { color } from '../../ui/theme';
import type { ToolProps } from '../registry';
import { useActiveHost } from '../shared/useActiveHost';
import { KIND_TEXT, analysisStateOf, controlCount, describeMore } from './analysis';
import type { AnalysisState } from './analysis';
import { PHONE_IDS, describeInput, mayChangePage, phoneFormOf, phoneInputOf, phoneMessageForm, phoneSignatureOf } from './phoneForm';
import type { PhoneInput } from './phoneForm';
import type { PageModel } from '../../../shared/pageControlMessages';

const ControlList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
`;

const ControlItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid ${color.lineSoft};
  &:last-child {
    border-bottom: none;
  }
`;

const ControlName = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
`;

const formatTime = (time: number) => new Date(time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const Groups: React.FC<{ model: PageModel; host: string }> = ({ model, host }) => {
  const [message, setMessage] = useState('');
  const locate = async (id: string) => {
    const reply = await highlightOnActivePage(host, id);
    setMessage(reply && reply.status === 'success' ? '' : 'That control has changed on the page. Press Analyse again.');
  };
  const more = describeMore(model.more);
  return (
    <>
      {model.scope === 'dialog' && <Notice $tone="info">A dialog is open on the page, so only its controls are listed.</Notice>}
      {model.groups.map(group => (
        <Card key={group.id} style={{ padding: 12 }}>
          <SectionLabel as="h3">{group.title}</SectionLabel>
          <ControlList>
            {group.controls.map(control => (
              <ControlItem key={control.id}>
                <ControlName title={control.label}>{control.label}</ControlName>
                <span style={{ color: color.muted, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {control.primary ? 'Main button' : KIND_TEXT[control.kind]}
                </span>
                <SmallButton type="button" onClick={() => locate(control.id)} aria-label={`Locate ${control.label} on the page`}>
                  Locate
                </SmallButton>
              </ControlItem>
            ))}
          </ControlList>
        </Card>
      ))}
      {more && <Caption>Also on the page, not listed: {more}.</Caption>}
      {message && <Notice $tone="warn">{message}</Notice>}
    </>
  );
};

// After input that may change the page (a press, a choice, going back), the page is analysed
// again a few times, so a new step, a dialog or a new page reaches the phone. Step 3 replaces
// this with watching the page.
const REANALYSE_AFTER_MS = [800, 2000, 4000];

const ACT_PROBLEMS: Record<string, (label: string) => string> = {
  disabled: label => `“${label}” can't be used at the moment.`,
  unsupported: label => `“${label}” can't be operated from the phone yet.`,
  gone: () => 'The page has changed, so it was analysed again.',
};

const phoneScreenOf = (state: AnalysisState, host: string, status: string) => {
  switch (state.status) {
    case 'done':
      return { key: phoneSignatureOf(state.model), screen: phoneFormOf(state.model, status) };
    case 'unreachable':
      return { key: 'unreachable', screen: phoneMessageForm('Page control', 'This tab cannot be operated. Reload the page, then press Analyse again.') };
    case 'other-site':
      return { key: 'other-site', screen: phoneMessageForm('Page control', 'This tab now shows another site. Press Analyse again to operate it.') };
    default:
      return { key: 'analysing', screen: phoneMessageForm('Page control', `Analysing ${host || 'the page'}…`) };
  }
};

export const PageAnalyseTool: React.FC<ToolProps> = ({ domain: openedOn, exit }) => {
  const { host, asked, ask } = useActiveHost(openedOn);
  const [state, setState] = useState<AnalysisState>({ status: 'analysing' });
  const [lastInput, setLastInput] = useState('');
  const timers = useRef<number[]>([]);
  const status = useRef('');
  const sent = useRef('');
  const screen = useRef(phoneScreenOf(state, host, '').screen);
  const mobile = useMobile(() => screen.current as unknown as InitData, true);

  const stopReanalysing = () => {
    timers.current.forEach(timer => window.clearTimeout(timer));
    timers.current = [];
  };
  useEffect(() => stopReanalysing, []);

  const analyse = useCallback(async () => {
    stopReanalysing();
    if (!host) {
      setState({ status: 'unreachable' });
      return;
    }
    setState({ status: 'analysing' });
    setState(analysisStateOf(await analyseActivePage(host), Date.now()));
  }, [host]);

  useEffect(() => {
    if (asked) analyse();
  }, [asked, analyse]);

  // Quietly, without "Analysing…": while a new page loads nothing answers, which only counts
  // on the last try.
  const reanalyseSoon = () => {
    stopReanalysing();
    timers.current = REANALYSE_AFTER_MS.map((delay, index) =>
      window.setTimeout(async () => {
        const reply = await analyseActivePage(host);
        if (reply || index === REANALYSE_AFTER_MS.length - 1) setState(analysisStateOf(reply, Date.now()));
      }, delay)
    );
  };

  const tellPhone = (text: string) => {
    status.current = text;
    mobile.sendValue(PHONE_IDS.status, text);
  };

  // The phone gets a new form only when the controls change, not when values do.
  useEffect(() => {
    const dialogNote = state.status === 'done' && state.model.scope === 'dialog' ? 'A dialog is open on the page, so only its controls are shown.' : '';
    const next = phoneScreenOf(state, host, status.current || dialogNote);
    screen.current = next.screen;
    if (next.key !== sent.current) {
      sent.current = next.key;
      mobile.sendInitData(next.screen as unknown as InitData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, host]);

  const run = async (input: PhoneInput) => {
    if (input.type === 'close') {
      exit();
      return;
    }
    if (input.type === 'analyse') {
      tellPhone('');
      if (state.status === 'other-site' || !host) ask();
      else analyse();
      return;
    }
    setLastInput(describeInput(input));
    if (input.type === 'page') {
      const reply = await pageActionOnActivePage(host, input.action);
      if (reply && reply.status === 'error') setState({ status: 'other-site' });
      else if (!reply) setState({ status: 'unreachable' });
      else if (mayChangePage(input)) reanalyseSoon();
      return;
    }
    const reply = await actOnActivePage(host, input.control.id, input.value);
    if (!reply) {
      // The page is reloading or moved on after a press; analysing again finds out.
      reanalyseSoon();
    } else if (reply.status === 'error' && reply.reason === 'host-mismatch') {
      setState({ status: 'other-site' });
    } else if (reply.status === 'error') {
      tellPhone(ACT_PROBLEMS[reply.reason](input.control.label));
      if (reply.reason === 'gone') analyse();
    } else {
      if (status.current) tellPhone('');
      if (mayChangePage(input)) reanalyseSoon();
    }
  };

  mobile.setOnchange(({ field }) => {
    const input = phoneInputOf(state.status === 'done' ? state.model : null, field.id as string, field.value);
    if (input) run(input);
  });

  const count = state.status === 'done' ? controlCount(state.model) : 0;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {host && <Site host={host} detail={state.status === 'done' ? `Analysed at ${formatTime(state.at)}` : 'Analysing this page'} />}
      <Row>
        <PrimaryButton type="button" onClick={host ? analyse : ask} disabled={state.status === 'analysing'}>
          {state.status === 'done' ? 'Analyse again' : 'Analyse page'}
        </PrimaryButton>
      </Row>
      {(state.status === 'analysing' || !asked) && <Notice $tone="info">Analysing the page…</Notice>}
      {state.status === 'unreachable' && asked && (
        <Notice $tone="warn">
          <strong>This tab cannot be analysed.</strong> Reload the page, then press Analyse page. Pages that were open before the extension was updated need a
          reload, and browser pages (such as chrome:// pages and the Chrome Web Store) cannot be operated.
        </Notice>
      )}
      {state.status === 'other-site' && (
        <>
          <Notice $tone="warn">This tab now shows another site.</Notice>
          <Row>
            <SmallButton type="button" onClick={ask}>
              Analyse this tab
            </SmallButton>
          </Row>
        </>
      )}
      {state.status === 'done' && count === 0 && <Text>Nothing on this page can be operated.</Text>}
      {state.status === 'done' && count > 0 && (
        <>
          <Text>
            {count} control{count === 1 ? '' : 's'} on this page.{' '}
            {mobile.isConnected ? 'Operate them from your phone.' : 'Connect your phone in the Sign in tab to operate them from it.'} Locate outlines one on the
            page.
          </Text>
          {lastInput && <Caption>From the phone: {lastInput}.</Caption>}
          <Groups model={state.model} host={host} />
        </>
      )}
    </div>
  );
};
