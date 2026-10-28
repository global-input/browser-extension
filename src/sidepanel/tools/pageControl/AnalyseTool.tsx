// Page control without presets or rules: the page is analysed when the tool opens (and again
// on request). The panel lists what can be operated, grouped as the page groups it, with Locate
// to outline a control on the page; the phone gets the same controls and operates them, and
// keeps up as the page changes. Controls can be pinned, hidden and renamed for the site.
// Values are never shown in the panel.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useMobile } from 'global-input-mobile';
import type { InitData } from 'global-input-react';
import {
  actOnActivePage,
  analyseActivePage,
  highlightOnActivePage,
  pageActionOnActivePage,
  stopPageControl,
  watchActiveTab,
  watchPageControlChanges,
  watchPageStates,
} from '../../adapters/chromePage';
import { Card, Notice, SectionLabel, Site, Text } from '../../ui/components';
import { Caption, PrimaryButton, Row, SmallButton, TextInput } from '../../ui/controls';
import { siteControlsStore } from '../../adapters/siteControls';
import { color } from '../../ui/theme';
import type { ToolProps } from '../registry';
import { useActiveHost } from '../shared/useActiveHost';
import { KIND_TEXT, analysisStateOf, controlCount, describeMore } from './analysis';
import type { AnalysisState } from './analysis';
import {
  PHONE_IDS,
  describeInput,
  phoneFormOf,
  phoneInputOf,
  phoneMessageForm,
  phoneSignatureOf,
  MORE_STEP,
  phoneValueChangesOf,
  phoneValuesOf,
  valueKeyOf,
} from './phoneForm';
import type { PhoneInput } from './phoneForm';
import { MAX_CONTROLS, MAX_CONTROLS_LIMIT } from '../../../shared/pageControlMessages';
import type { PageControl, PageModel } from '../../../shared/pageControlMessages';
import { EMPTY_SITE_CONTROLS, applySiteControls, hide, isCustomised, isPinned, pageNameOf, pin, rename, show, unpin } from './siteControls';
import type { SiteControls } from './siteControls';

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

const ControlEditor = styled.li`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0 10px;
  border-bottom: 1px solid ${color.lineSoft};
`;

interface GroupsProps {
  model: PageModel;
  host: string;
  site: SiteControls;
  onSiteChange: (site: SiteControls) => void;
  onShowMore?: () => void;
}

// Pin, hide and rename one control; remembered for the site straight away.
const EditControl: React.FC<{ control: PageControl; site: SiteControls; onSiteChange: (site: SiteControls) => void; done: () => void }> = ({
  control,
  site,
  onSiteChange,
  done,
}) => {
  const [name, setName] = useState(control.label.replace(/\s\(\d+\)$/, ''));
  const pinned = isPinned(site, control);
  return (
    <ControlEditor>
      <Row>
        <SmallButton type="button" onClick={() => onSiteChange(pinned ? unpin(site, control) : pin(site, control))}>
          {pinned ? 'Unpin' : 'Pin to the top'}
        </SmallButton>
        <SmallButton
          type="button"
          onClick={() => {
            onSiteChange(hide(site, control));
            done();
          }}
        >
          Hide from the phone
        </SmallButton>
      </Row>
      <form
        style={{ display: 'flex', gap: 8 }}
        onSubmit={event => {
          event.preventDefault();
          onSiteChange(rename(site, control, name));
          done();
        }}
      >
        <TextInput aria-label={`Your name for ${pageNameOf(control)}`} value={name} onChange={event => setName(event.target.value)} style={{ flex: 1, minWidth: 0 }} />
        <SmallButton type="submit">Rename</SmallButton>
      </form>
      <Caption>The page calls it “{pageNameOf(control)}”. An empty name uses the page’s name again.</Caption>
    </ControlEditor>
  );
};

const Groups: React.FC<GroupsProps> = ({ model, host, site, onSiteChange, onShowMore }) => {
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
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
              <React.Fragment key={control.id}>
                <ControlItem>
                  <ControlName title={control.label}>{control.label}</ControlName>
                  <span style={{ color: color.muted, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {control.primary ? 'Main button' : KIND_TEXT[control.kind]}
                  </span>
                  <SmallButton type="button" onClick={() => locate(control.id)} aria-label={`Locate ${control.label} on the page`}>
                    Locate
                  </SmallButton>
                  <SmallButton
                    type="button"
                    aria-expanded={editing === control.id}
                    aria-label={`Change how ${control.label} shows on the phone`}
                    onClick={() => setEditing(current => (current === control.id ? null : control.id))}
                  >
                    {editing === control.id ? 'Done' : 'Change'}
                  </SmallButton>
                </ControlItem>
                {editing === control.id && <EditControl control={control} site={site} onSiteChange={onSiteChange} done={() => setEditing(null)} />}
              </React.Fragment>
            ))}
          </ControlList>
        </Card>
      ))}
      {more && (
        <Row>
          <Caption>Also on the page, not listed: {more}.</Caption>
          {onShowMore && (
            <SmallButton type="button" onClick={onShowMore}>
              Show more
            </SmallButton>
          )}
        </Row>
      )}
      {site.hidden.length > 0 && (
        <Card style={{ padding: 12 }}>
          <SectionLabel as="h3">Hidden from the phone</SectionLabel>
          <ControlList>
            {site.hidden.map(ref => (
              <ControlItem key={`${ref.kind}|${ref.label}`}>
                <ControlName title={ref.label}>{ref.label}</ControlName>
                <span style={{ color: color.muted, fontSize: 12, whiteSpace: 'nowrap' }}>{KIND_TEXT[ref.kind]}</span>
                <SmallButton type="button" onClick={() => onSiteChange(show(site, ref))}>
                  Show
                </SmallButton>
              </ControlItem>
            ))}
          </ControlList>
        </Card>
      )}
      {isCustomised(site) && (
        <Row>
          <Caption>Pinned, hidden and renamed controls are remembered for {host}.</Caption>
          <SmallButton type="button" onClick={() => onSiteChange(EMPTY_SITE_CONTROLS)}>
            Reset this site
          </SmallButton>
        </Row>
      )}
      {message && <Notice $tone="warn">{message}</Notice>}
    </>
  );
};

const ACT_PROBLEMS: Record<string, (label: string) => string> = {
  disabled: label => `“${label}” can't be used at the moment.`,
  unsupported: label => `“${label}” can't be operated from the phone yet.`,
  gone: () => 'The page has changed, so it was analysed again.',
};

// A tab that showed nothing answering after an input is analysed again after this long: the
// page is usually loading, and reports itself when it has loaded.
const NO_ANSWER_RETRY_MS = 3000;

const otherSiteText = (other?: string) => `This tab now shows ${other || 'another site'}.`;

const phoneScreenOf = (state: AnalysisState, host: string, status: string) => {
  switch (state.status) {
    case 'done':
      return { key: phoneSignatureOf(state.model), screen: phoneFormOf(state.model, status) };
    case 'unreachable':
      return { key: 'unreachable', screen: phoneMessageForm('Page control', 'This tab cannot be operated. Reload the page, then press Analyse again.') };
    case 'other-site':
      return { key: `other-site:${state.host || ''}`, screen: phoneMessageForm('Page control', `${otherSiteText(state.host)} Press Analyse again to operate it.`) };
    default:
      return { key: 'analysing', screen: phoneMessageForm('Page control', `Analysing ${host || 'the page'}…`) };
  }
};

// Another site keeps the name it was reported with, when analysing again can only say "another site".
const keepOtherSite = (next: AnalysisState) => (previous: AnalysisState) =>
  next.status === 'other-site' && !next.host && previous.status === 'other-site' ? previous : next;

export const PageAnalyseTool: React.FC<ToolProps> = ({ domain: openedOn, exit }) => {
  const { host, asked, ask } = useActiveHost(openedOn);
  const [state, setState] = useState<AnalysisState>({ status: 'analysing' });
  const [lastInput, setLastInput] = useState('');
  // Raised by "Show more", for as long as Page control is open.
  const limit = useRef(MAX_CONTROLS);
  // What is remembered for the site; the page gets it with each analysis.
  const [site, setSite] = useState<SiteControls>(() => siteControlsStore.get(host));
  const siteRef = useRef(site);
  useEffect(() => {
    siteRef.current = siteControlsStore.get(host);
    setSite(siteRef.current);
  }, [host]);
  const retry = useRef<number | null>(null);
  const status = useRef('');
  const sent = useRef('');
  // What the phone shows for each control, so only values the page changed are sent.
  const shown = useRef(new Map<string, string>());
  const screen = useRef(phoneScreenOf(state, host, '').screen);
  const mobile = useMobile(() => screen.current as unknown as InitData, true);

  // Quietly (without "Analysing…") when keeping up with the page.
  const analyse = useCallback(
    async (quiet = false) => {
      if (retry.current) window.clearTimeout(retry.current);
      retry.current = null;
      if (!host) {
        setState({ status: 'unreachable' });
        return;
      }
      if (!quiet) setState({ status: 'analysing' });
      const custom = { pinned: siteRef.current.pinned, hidden: siteRef.current.hidden };
      setState(keepOtherSite(analysisStateOf(await analyseActivePage(host, limit.current, custom), Date.now())));
    },
    [host]
  );

  const showMore = () => {
    limit.current = Math.min(MAX_CONTROLS_LIMIT, limit.current + MORE_STEP);
    analyse(true);
  };

  const changeSite = (next: SiteControls) => {
    siteRef.current = next;
    setSite(next);
    siteControlsStore.set(host, next);
    analyse(true);
  };

  // The analysis as shown: your names, pinned controls first.
  const view = useMemo<AnalysisState>(() => (state.status === 'done' ? { ...state, model: applySiteControls(state.model, site) } : state), [state, site]);

  useEffect(() => {
    if (asked) analyse();
  }, [asked, analyse]);

  // Keeping up with the page: changes the page reports, a new page loaded in the tab (it
  // reports itself), and switching tabs. Pages stop reporting when Page control closes.
  useEffect(() => {
    if (!host) return undefined;
    let activeTab: number | null = null;
    const stopChanges = watchPageControlChanges((tabId, model) => {
      if ((activeTab !== null && tabId !== activeTab) || model.host !== host) return false;
      setState({ status: 'done', model, at: Date.now() });
      return true;
    });
    const stopPages = watchPageStates((tabId, page) => {
      if (tabId !== activeTab) return;
      if (page.host === host) analyse(true);
      else setState({ status: 'other-site', host: page.host });
    });
    const stopTabs = watchActiveTab(tabId => {
      const switched = activeTab !== null && activeTab !== tabId;
      activeTab = tabId;
      if (switched) analyse(true);
    });
    return () => {
      stopChanges();
      stopPages();
      stopTabs();
    };
  }, [host, analyse]);

  useEffect(
    () => () => {
      if (retry.current) window.clearTimeout(retry.current);
      stopPageControl();
    },
    []
  );

  const tellPhone = (text: string) => {
    status.current = text;
    mobile.sendValue(PHONE_IDS.status, text);
  };

  // The phone gets a new form when the controls change; otherwise only the values the page
  // changed by itself.
  useEffect(() => {
    const dialogNote = view.status === 'done' && view.model.scope === 'dialog' ? 'A dialog is open on the page, so only its controls are shown.' : '';
    const next = phoneScreenOf(view, host, status.current || dialogNote);
    screen.current = next.screen;
    if (next.key !== sent.current) {
      sent.current = next.key;
      shown.current = view.status === 'done' ? phoneValuesOf(view.model) : new Map();
      mobile.sendInitData(next.screen as unknown as InitData);
    } else if (view.status === 'done') {
      for (const change of phoneValueChangesOf(view.model, shown.current)) {
        shown.current.set(change.id, change.key);
        mobile.sendValue(change.id, change.value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, host]);

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
    if (input.type === 'more') {
      showMore();
      return;
    }
    setLastInput(describeInput(input));
    const reply =
      input.type === 'page'
        ? await pageActionOnActivePage(host, input.action)
        : input.type === 'media'
          ? await actOnActivePage(host, input.control.id, undefined, input.operation)
          : await actOnActivePage(host, input.control.id, input.value);
    if (!reply) {
      // The page is loading after a press; it reports itself once loaded.
      if (!retry.current) retry.current = window.setTimeout(() => analyse(true), NO_ANSWER_RETRY_MS);
    } else if (reply.status === 'error' && reply.reason === 'host-mismatch') {
      setState(keepOtherSite({ status: 'other-site' }));
    } else if (reply.status === 'error' && input.type !== 'page') {
      tellPhone(ACT_PROBLEMS[reply.reason](input.control.label));
      if (reply.reason === 'gone') analyse(true);
    } else if (status.current) {
      tellPhone('');
    }
  };

  mobile.setOnchange(({ field }) => {
    const input = phoneInputOf(view.status === 'done' ? view.model : null, field.id as string, field.value);
    if (!input) return;
    if (input.type === 'control' || input.type === 'media') shown.current.set(field.id as string, valueKeyOf(field.value));
    run(input);
  });

  const count = view.status === 'done' ? controlCount(view.model) : 0;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {host && <Site host={host} detail={state.status === 'done' ? `Analysed at ${formatTime(state.at)}` : 'Analysing this page'} />}
      <Row>
        <PrimaryButton type="button" onClick={host ? () => analyse() : ask} disabled={state.status === 'analysing'}>
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
          <Notice $tone="warn">{otherSiteText(state.host)}</Notice>
          <Row>
            <SmallButton type="button" onClick={ask}>
              Analyse this tab
            </SmallButton>
          </Row>
        </>
      )}
      {state.status === 'done' && count === 0 && (
        <>
          <Text>Nothing on this page can be operated.</Text>
          {site.hidden.length > 0 && <Groups model={state.model} host={host} site={site} onSiteChange={changeSite} />}
        </>
      )}
      {state.status === 'done' && count > 0 && (
        <>
          <Text>
            {count} control{count === 1 ? '' : 's'} on this page.{' '}
            {mobile.isConnected ? 'Operate them from your phone.' : 'Connect your phone in the Sign in tab to operate them from it.'} Locate outlines one on the
            page.
          </Text>
          {lastInput && <Caption>From the phone: {lastInput}.</Caption>}
          <Groups
            model={view.status === 'done' ? view.model : state.model}
            host={host}
            site={site}
            onSiteChange={changeSite}
            onShowMore={limit.current < MAX_CONTROLS_LIMIT ? showMore : undefined}
          />
        </>
      )}
    </div>
  );
};
