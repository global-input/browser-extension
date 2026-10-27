// Page control in the panel's design. The rule engine (src/app/page-control/rules) and the phone
// screens of the popup tool are reused, so the phone sees no change. Three panel screens:
// control (find the page's controls and hand them to the phone), edit rule, and presets.
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useMobile } from 'global-input-mobile';
import * as chromeExtension from '../../../app/chrome-extension';
import { activeTabHost } from '../../adapters/chromePage';
import * as storage from '../../../app/storage';
import * as rules from '../../../app/page-control/rules';
import type { PageRule, ProcessData } from '../../../app/page-control/rules';
import { useConnectErrorControl, useConnectToPageControl } from '../../../app/page-control/mobile-ui';
import { useConnectToMobile as useConnectEditRule } from '../../../app/edit-rule/mobile-ui';
import { Button, Card, Notice, SectionLabel, Site } from '../../ui/components';
import { Caption, Label, PrimaryButton, Row, Select, TextArea } from '../../ui/controls';
import { color, font } from '../../ui/theme';
import type { ToolProps } from '../registry';
import { RULE_SOURCE_TEXT, describeControl, ruleSourceOf, validateRuleContent } from './model';
import type { PageControlScreen } from './model';

const RuleText = styled(TextArea)`
  font-family: ${font.mono};
  font-size: 12px;
  line-height: 1.45;
`;

const ControlList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ControlItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid ${color.lineSoft};
  &:last-child {
    border-bottom: none;
  }
`;

// --- control ---

const ErrorView: React.FC<{ domain: string; data: ProcessData; exit: () => void; edit: () => void; retry: () => void }> = ({
  domain,
  data,
  exit,
  edit,
  retry,
}) => {
  const title = data.errorTitle || 'Error';
  const message = data.errorMessage || 'Unknown Error';
  useConnectErrorControl(domain, exit, edit, title, message);
  return (
    <>
      <Notice $tone="warn">
        <strong>{title}.</strong> {message}
      </Notice>
      <Row>
        {domain && (
          <PrimaryButton type="button" onClick={edit}>
            Edit rule
          </PrimaryButton>
        )}
        <Button type="button" onClick={retry}>
          Try again
        </Button>
      </Row>
    </>
  );
};

const ControllingView: React.FC<{ data: ProcessData; exit: () => void; edit: () => void; retry: () => void }> = ({ data, exit, edit, retry }) => {
  const mobile = useConnectToPageControl(data, exit, edit);
  const controls = (data.fields || []).map(describeControl);
  return (
    <>
      {mobile.isConnected ? (
        <Notice $tone="success">Your phone can now operate this page.</Notice>
      ) : (
        <Notice $tone="info">Connect your phone in the Sign in tab to operate this page from it.</Notice>
      )}
      <Card style={{ padding: 12 }}>
        <SectionLabel as="h3">{data.formRule?.title || 'Controls found'}</SectionLabel>
        <ControlList>
          {controls.map((control, index) => (
            <ControlItem key={index}>
              <span style={{ fontWeight: 600 }}>{control.label}</span>
              <span style={{ color: color.muted }}>{control.kind}</span>
            </ControlItem>
          ))}
        </ControlList>
      </Card>
      <Row>
        <Button type="button" onClick={retry} title="Look for the controls again, for example after the page changed">
          Find again
        </Button>
        <Button type="button" onClick={edit}>
          Edit rule
        </Button>
      </Row>
    </>
  );
};

const NO_PAGE: ProcessData = {
  step: rules.ProcessStep.ERROR,
  errorTitle: 'This tab cannot be controlled',
  errorMessage:
    'Reload the page, then press Try again. Pages that were open before the extension was updated need a reload, and browser pages (such as chrome:// pages and the Chrome Web Store) cannot be controlled.',
};

const ControlScreen: React.FC<{ domain: string; exit: () => void; edit: () => void; retry?: () => void }> = ({ domain, exit, edit, retry: askAgain }) => {
  const [data, setData] = useState<ProcessData>({ step: rules.ProcessStep.LOADING });
  const [attempt, setAttempt] = useState(0);
  const source = ruleSourceOf(domain ? storage.getPageControlRule(domain) : null, domain ? rules.findRuleByDomain(domain) : null);

  useEffect(() => {
    if (!domain) {
      setData(NO_PAGE);
      return;
    }
    const rule = rules.findRuleByDomain(domain);
    if (!rule) {
      setData({ step: rules.ProcessStep.ERROR, errorTitle: 'No page rule', errorMessage: `There is no page rule for ${domain} yet. Press Edit rule to write one or start from a preset.` });
      return;
    }
    setData(previous => ({ ...previous, step: rules.ProcessStep.LOADING }));
    rules.processRule({
      setProcessData: setData,
      rule,
      domain,
      sendRuleToPage: (pageRule: PageRule) => chromeExtension.getPageControlConfig(pageRule),
      sendFieldValueToPage: (fieldId: string, value: string) => chromeExtension.sendFormField(fieldId, value),
    });
  }, [domain, attempt]);

  const retry = askAgain || (() => setAttempt(n => n + 1));
  return (
    <>
      {domain && <Site host={domain} detail={RULE_SOURCE_TEXT[source]} />}
      {data.step === rules.ProcessStep.LOADING && <Notice $tone="info">Finding the controls on this page…</Notice>}
      {data.step === rules.ProcessStep.ERROR && <ErrorView domain={domain} data={data} exit={exit} edit={edit} retry={retry} />}
      {data.step === rules.ProcessStep.SUCCESS && <ControllingView data={data} exit={exit} edit={edit} retry={retry} />}
    </>
  );
};

// The site comes from the active tab itself, so the tool does not depend on what the Sign in
// tab knew when it was opened. null: still asking.
const useActiveHost = (initial: string) => {
  const [host, setHost] = useState<string | null>(initial || null);
  const [asked, setAsked] = useState(!!initial);
  const ask = () => {
    setAsked(false);
    activeTabHost().then(found => {
      setHost(found);
      setAsked(true);
    });
  };
  useEffect(() => {
    if (!initial) {
      ask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { host: host || '', asked, ask };
};

// --- edit rule ---

const EditScreen: React.FC<{ domain: string; draft: string; done: () => void; presets: (draft: string) => void }> = ({
  domain,
  draft,
  done,
  presets,
}) => {
  const [content, setContent] = useState(draft);
  const [error, setError] = useState<string | null>(null);
  const save = () => {
    const problem = validateRuleContent(content);
    if (problem) {
      setError(problem);
      return;
    }
    if (content.trim()) {
      rules.saveRule(domain, content);
    } else {
      rules.removeRule(domain);
    }
    done();
  };
  const { sendContent } = useConnectEditRule(
    domain,
    content,
    done,
    value => {
      setContent(value);
      setError(null);
    },
    save,
    () => presets(content),
  );
  const edit = (value: string) => {
    setContent(value);
    setError(null);
    sendContent(value);
  };
  return (
    <>
      <Label>
        Page rule for {domain}
        <RuleText rows={16} spellCheck={false} value={content} onChange={event => edit(event.target.value)} placeholder='{ "forms": [ ... ] }' />
        <Caption>
          A JSON rule that tells the extension which elements of the page your phone controls. You can also edit it on your phone. Leave it empty and save to
          remove your saved rule.
        </Caption>
      </Label>
      {error && (
        <Notice $tone="warn" role="status">
          {error}
        </Notice>
      )}
      <Row>
        <PrimaryButton type="button" onClick={save}>
          Save
        </PrimaryButton>
        <Button type="button" onClick={() => presets(content)}>
          Start from a preset
        </Button>
        <Button type="button" onClick={done}>
          Cancel
        </Button>
      </Row>
    </>
  );
};

// --- presets ---

// The phone screen of the popup's preset page.
const PRESET_FIELDS = {
  info: { id: 'info', type: 'info', value: 'Please operate in the extension window on your computer' },
  back: { id: 'back-to-edit', type: 'button', label: 'Back', viewId: 'row4' },
};

const PresetScreen: React.FC<{ back: () => void; use: (content: string) => void }> = ({ back, use }) => {
  const items = useMemo(() => rules.buildSelectionItems(), []);
  const [selected, setSelected] = useState('0');
  const content = useMemo(() => rules.getPresetRuleByIndexForEdit(parseInt(selected, 10)), [selected]);
  const mobile = useMobile({ form: { title: 'Preset Rules', fields: [PRESET_FIELDS.info, PRESET_FIELDS.back] } });
  mobile.setOnchange(({ field }) => {
    if (field.id === PRESET_FIELDS.back.id) {
      back();
    }
  });
  return (
    <>
      <Label>
        Preset
        <Select value={selected} onChange={event => setSelected(event.target.value)}>
          {items.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Caption>Built-in rules for well-known sites. Use one as a starting point for this site's rule.</Caption>
      </Label>
      <Label>
        Rule
        <RuleText rows={12} readOnly value={content} />
      </Label>
      <Row>
        <PrimaryButton type="button" onClick={() => use(content)}>
          Use this preset
        </PrimaryButton>
        <Button type="button" onClick={back}>
          Back
        </Button>
      </Row>
    </>
  );
};

// --- the tool ---

export const PageControlTool: React.FC<ToolProps> = ({ domain: openedOn, exit }) => {
  const { host: domain, asked, ask } = useActiveHost(openedOn);
  const [screen, setScreen] = useState<PageControlScreen>({ name: 'control' });
  const control = () => setScreen({ name: 'control' });
  // A rule belongs to a site, so there is nothing to edit without one.
  const edit = (draft?: string) => domain && setScreen({ name: 'edit', draft: draft ?? rules.getRulesForEdit(domain) });
  const view = (() => {
    switch (screen.name) {
      case 'edit':
        return <EditScreen key={screen.draft} domain={domain} draft={screen.draft} done={control} presets={draft => setScreen({ name: 'preset', draft })} />;
      case 'preset':
        return <PresetScreen back={() => edit(screen.draft)} use={content => edit(content)} />;
      default:
        if (!asked) {
          return <Notice $tone="info">Finding the controls on this page…</Notice>;
        }
        // Without a site, Try again asks the active tab again (for example after a reload).
        return <ControlScreen key={domain} domain={domain} exit={exit} edit={() => edit()} retry={domain ? undefined : ask} />;
    }
  })();
  return <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>{view}</div>;
};
