// Encrypt and Decrypt in the panel's design. The panel shows one view per stage of
// flow.ts; each stage view mounts the phone screen of the popup tool for that stage, so the
// phone sees no change. Text can also be taken from the focused field on the page and the
// result put back in its place, so plain text need not appear on the computer's screen.
import React, { useReducer, useState } from 'react';
import type { MobileData } from 'global-input-mobile';
import { Button, Card, Notice, SectionLabel, Text } from '../../ui/components';
import { Caption, Concealed, Label, PrimaryButton, Row, SmallButton, TextArea } from '../../ui/controls';
import { color } from '../../ui/theme';
import type { ToolProps } from '../registry';
import { AUTO_HIDE_MS, useAutoHide } from '../shared/autoHide';
import { copyToClipboard, insertIntoPage, readFromPage } from '../shared/pageInsert';
import type { ToolMessage } from '../shared/pageInsert';
import { cryptoReducer, initialCryptoState } from './flow';
import type { CryptoEvent, CryptoState } from './flow';
import type { CryptoKind } from './kinds';
import { useProcessOnPhone } from './processOnPhone';
import { useActiveHost } from '../shared/useActiveHost';
import showIcon from '../../../app/mobile-encryption/encrypt-content/images/show-icon.png';
import sendIcon from '../../../app/mobile-encryption/encrypt-content/images/send-icon.png';

type Dispatch = (event: CryptoEvent) => void;

const NotConnected: React.FC<{ mobile: MobileData }> = ({ mobile }) =>
  mobile.isConnected ? null : <Notice $tone="info">Connect your phone in the Sign in tab first. The key stays on your phone.</Notice>;

const PhoneIcon: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <img src={src} alt={alt} width={18} height={18} style={{ verticalAlign: 'middle', margin: '0 2px' }} />
);

// --- input ---

const AUTO_HIDE_TEXT = `Hides again after ${AUTO_HIDE_MS / 1000} seconds, or when the panel is hidden.`;

interface InputProps {
  kind: CryptoKind;
  state: Extract<CryptoState, { stage: 'input' }>;
  dispatch: Dispatch;
  domain: string;
  exit: () => void;
}

interface InputViewProps extends InputProps {
  mobile: MobileData;
  onEdit: (content: string) => void;
  onFromPage: (content: string) => void;
  start: () => void;
}

const InputView: React.FC<InputViewProps> = ({ kind, state, dispatch, domain, mobile, onEdit, onFromPage, start }) => {
  const [message, setMessage] = useState<ToolMessage>(null);
  const [revealed, setRevealed] = useState(false);
  const conceal = !!state.fromPage && kind.concealPageInput;
  useAutoHide(conceal && revealed, () => setRevealed(false));
  const takeFromPage = async () => {
    const read = await readFromPage(domain);
    if ('value' in read) {
      setRevealed(false);
      setMessage(null);
      onFromPage(read.value);
    } else {
      setMessage(read.message);
    }
  };
  return (
    <>
      <NotConnected mobile={mobile} />
      <Label>
        {kind.text.inputLabel}
        {conceal && !revealed ? (
          <Concealed label={kind.text.inputLabel} hint="Taken from the page and hidden. Press Show to see it." />
        ) : (
          <TextArea rows={6} value={state.content} placeholder={kind.text.inputPlaceholder} onChange={event => onEdit(event.target.value)} />
        )}
        <Caption>
          {state.fromPage
            ? `Taken from the focused field on ${domain}. The result can go back in its place.`
            : `${kind.text.inputCaption} To work on text in the page, click into its field, then press Use the focused field.`}
          {conceal && revealed && ` ${AUTO_HIDE_TEXT}`}
        </Caption>
      </Label>
      <Row>
        <SmallButton type="button" onClick={takeFromPage} title="Take the text of the field that has focus on the page">
          Use the focused field
        </SmallButton>
        {conceal && (
          <SmallButton type="button" aria-pressed={revealed} onClick={() => setRevealed(!revealed)}>
            {revealed ? 'Hide' : 'Show'}
          </SmallButton>
        )}
        {state.fromPage && (
          <SmallButton type="button" onClick={() => onEdit('')}>
            Clear
          </SmallButton>
        )}
        {state.phone === 'computer' && (
          <SmallButton type="button" disabled={!mobile.isConnected} onClick={() => dispatch({ type: 'type-on-phone' })}>
            Type on my phone instead
          </SmallButton>
        )}
      </Row>
      {state.phone === 'mobile' && <Notice $tone="info">You can also type on your phone. Both sides show the same text.</Notice>}
      {state.error === 'empty' && <Notice $tone="warn">Type or paste some text first, or use the focused field.</Notice>}
      {message && (
        <Notice $tone={message.tone} role="status">
          {message.text}
        </Notice>
      )}
      <PrimaryButton type="button" disabled={!mobile.isConnected} onClick={start}>
        {kind.text.start}
      </PrimaryButton>
    </>
  );
};

const useStart = (kind: CryptoKind, state: InputProps['state'], dispatch: Dispatch) => (mobile: MobileData) => {
  if (!state.content.trim()) {
    mobile.sendValue(kind.phoneInfoId, { content: kind.text.empty, style: { color: 'red' } });
  }
  dispatch({ type: 'start' });
};

const InputOnComputer: React.FC<InputProps> = props => {
  const { kind, state, dispatch, exit } = props;
  const start = useStart(kind, state, dispatch);
  const mobile = kind.useInputOnComputer({
    initialContent: state.content,
    cancel: exit,
    setContent: content => dispatch({ type: 'edit', content }),
    onTypeOnPhone: () => dispatch({ type: 'type-on-phone' }),
    onStart: () => start(mobile),
  });
  return (
    <InputView
      {...props}
      mobile={mobile}
      onEdit={content => dispatch({ type: 'edit', content })}
      onFromPage={content => dispatch({ type: 'from-page', content })}
      start={() => start(mobile)}
    />
  );
};

// The phone also shows the text here; it is the user's own screen.
const InputOnMobile: React.FC<InputProps> = props => {
  const { kind, state, dispatch, exit } = props;
  const start = useStart(kind, state, dispatch);
  const mobile = kind.useInputOnMobile({
    initialContent: state.content,
    cancel: exit,
    setContent: content => dispatch({ type: 'edit', content }),
    onTypeOnPhone: () => undefined,
    onStart: () => start(mobile),
  });
  const onEdit = (content: string) => {
    dispatch({ type: 'edit', content });
    mobile.sendValue(kind.phoneContentId, content);
  };
  const onFromPage = (content: string) => {
    dispatch({ type: 'from-page', content });
    mobile.sendValue(kind.phoneContentId, content);
  };
  return <InputView {...props} mobile={mobile} onEdit={onEdit} onFromPage={onFromPage} start={() => start(mobile)} />;
};

// --- processing ---

const Processing: React.FC<{ kind: CryptoKind; state: Extract<CryptoState, { stage: 'processing' }>; dispatch: Dispatch }> = ({
  kind,
  state,
  dispatch,
}) => {
  const mobile = useProcessOnPhone(kind, state.content, {
    onResult: result => dispatch({ type: 'received', result }),
    onBack: () => dispatch({ type: 'back' }),
  });
  return (
    <>
      <NotConnected mobile={mobile} />
      <Card style={{ padding: 12 }}>
        <SectionLabel as="h3">{kind.text.processingTitle}</SectionLabel>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, color: color.inkSoft }}>
          <li>
            On your phone, press <PhoneIcon src={showIcon} alt="Show" /> to check the content it received.
          </li>
          <li>
            Press <PhoneIcon src={kind.actionIcon} alt={kind.text.processingAction} /> to {kind.text.processingAction.toLowerCase()} it.
          </li>
          <li>
            Check the result, then press <PhoneIcon src={sendIcon} alt="Send" /> to send it here.
          </li>
        </ol>
      </Card>
      {state.error === 'failed' && <Notice $tone="warn">{kind.text.failed} Try again on your phone, or go back.</Notice>}
      <Row>
        <Button type="button" onClick={() => dispatch({ type: 'back' })}>
          Back
        </Button>
      </Row>
    </>
  );
};

// --- result ---

interface ResultProps {
  kind: CryptoKind;
  state: Extract<CryptoState, { stage: 'result' }>;
  dispatch: Dispatch;
  domain: string;
  exit: () => void;
}

const ResultView: React.FC<ResultProps & { mobile: MobileData }> = ({ kind, state, dispatch, domain, exit, mobile }) => {
  const [message, setMessage] = useState<ToolMessage>(null);
  const [revealed, setRevealed] = useState(!kind.concealResult);
  useAutoHide(kind.concealResult && revealed, () => setRevealed(false));
  const label = kind.text.resultLabel.toLowerCase();
  const insert = async () => setMessage(await insertIntoPage(label, state.result, domain));
  return (
    <>
      <NotConnected mobile={mobile} />
      <Notice $tone="success">Received from your phone.</Notice>
      <Label>
        {kind.text.resultLabel}
        {revealed ? (
          <TextArea rows={6} readOnly value={state.result} />
        ) : (
          <Concealed label={kind.text.resultLabel} hint="Hidden. Press Show to see it." />
        )}
        <Caption>
          {kind.text.resultCaption}
          {kind.concealResult && revealed && ` ${AUTO_HIDE_TEXT}`}
        </Caption>
      </Label>
      {state.fromPage && (
        <>
          <PrimaryButton type="button" onClick={insert}>
            Put back into the page
          </PrimaryButton>
          <Caption>Replaces the text of the field you took it from, while that field still has focus on the page.</Caption>
        </>
      )}
      <Row>
        {kind.concealResult && (
          <SmallButton type="button" aria-pressed={revealed} onClick={() => setRevealed(!revealed)}>
            {revealed ? 'Hide' : 'Show'}
          </SmallButton>
        )}
        {!state.fromPage && (
          <SmallButton type="button" onClick={insert}>
            Insert into page
          </SmallButton>
        )}
        <SmallButton type="button" onClick={async () => setMessage(await copyToClipboard(label, state.result))}>
          Copy
        </SmallButton>
        {state.phone === 'computer' && (
          <SmallButton type="button" disabled={!mobile.isConnected} onClick={() => dispatch({ type: 'show-on-phone' })}>
            Show on my phone
          </SmallButton>
        )}
      </Row>
      {state.phone === 'mobile' && <Notice $tone="info">It is on your phone too: tap it there to copy it.</Notice>}
      {message && (
        <Notice $tone={message.tone} role="status">
          {message.text}
        </Notice>
      )}
      <Row>
        <Button type="button" onClick={() => dispatch({ type: 'restart' })}>
          {kind.text.restart}
        </Button>
        <Button type="button" onClick={exit}>
          Done
        </Button>
      </Row>
    </>
  );
};

const resultScreen = (props: ResultProps) => ({
  result: props.state.result,
  restart: () => props.dispatch({ type: 'restart' }),
  onShowOnPhone: () => props.dispatch({ type: 'show-on-phone' }),
  finish: props.exit,
});

const ResultOnComputer: React.FC<ResultProps> = props => <ResultView {...props} mobile={props.kind.useResultOnComputer(resultScreen(props))} />;

const ResultOnMobile: React.FC<ResultProps> = props => <ResultView {...props} mobile={props.kind.useResultOnMobile(resultScreen(props))} />;

// --- the tool ---

export const PhoneCryptoTool: React.FC<ToolProps & { kind: CryptoKind }> = ({ kind, domain: openedOn, exit }) => {
  const [state, dispatch] = useReducer(cryptoReducer, initialCryptoState);
  const { host: domain } = useActiveHost(openedOn);
  // A stage or phone-screen change mounts a different view, so the phone gets that screen's form.
  const view = (() => {
    switch (state.stage) {
      case 'input':
        return state.phone === 'mobile' ? (
          <InputOnMobile key="input-mobile" kind={kind} state={state} dispatch={dispatch} domain={domain} exit={exit} />
        ) : (
          <InputOnComputer key="input-computer" kind={kind} state={state} dispatch={dispatch} domain={domain} exit={exit} />
        );
      case 'processing':
        return <Processing key="processing" kind={kind} state={state} dispatch={dispatch} />;
      case 'result':
        return state.phone === 'mobile' ? (
          <ResultOnMobile key="result-mobile" kind={kind} state={state} dispatch={dispatch} domain={domain} exit={exit} />
        ) : (
          <ResultOnComputer key="result-computer" kind={kind} state={state} dispatch={dispatch} domain={domain} exit={exit} />
        );
    }
  })();
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {view}
      <Text style={{ fontSize: 12 }}>Nothing you type here is stored.</Text>
    </div>
  );
};
