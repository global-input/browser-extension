// Encrypt and Decrypt in the panel's design. The panel shows one view per stage of
// flow.ts; each stage view mounts the phone screen of the popup tool for that stage, so the
// phone sees no change.
import React, { useReducer, useState } from 'react';
import type { MobileData } from 'global-input-mobile';
import { Button, Card, Notice, SectionLabel, Text } from '../../ui/components';
import { Caption, Label, PrimaryButton, Row, SmallButton, TextArea } from '../../ui/controls';
import { color } from '../../ui/theme';
import type { ToolProps } from '../registry';
import { copyToClipboard, insertIntoPage } from '../shared/pageInsert';
import type { ToolMessage } from '../shared/pageInsert';
import { cryptoReducer, initialCryptoState } from './flow';
import type { CryptoEvent, CryptoState } from './flow';
import type { CryptoKind } from './kinds';
import { useProcessOnPhone } from './processOnPhone';
import showIcon from '../../../app/mobile-encryption/encrypt-content/images/show-icon.png';
import sendIcon from '../../../app/mobile-encryption/encrypt-content/images/send-icon.png';

type Dispatch = (event: CryptoEvent) => void;

const NotConnected: React.FC<{ mobile: MobileData }> = ({ mobile }) =>
  mobile.isConnected ? null : <Notice $tone="info">Connect your phone in the Sign in tab first. The key stays on your phone.</Notice>;

const PhoneIcon: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <img src={src} alt={alt} width={18} height={18} style={{ verticalAlign: 'middle', margin: '0 2px' }} />
);

// --- input ---

interface InputProps {
  kind: CryptoKind;
  state: Extract<CryptoState, { stage: 'input' }>;
  dispatch: Dispatch;
  exit: () => void;
}

const InputView: React.FC<InputProps & { mobile: MobileData; onEdit: (content: string) => void; start: () => void }> = ({
  kind,
  state,
  dispatch,
  mobile,
  onEdit,
  start,
}) => (
  <>
    <NotConnected mobile={mobile} />
    <Label>
      {kind.text.inputLabel}
      <TextArea rows={6} value={state.content} placeholder={kind.text.inputPlaceholder} onChange={event => onEdit(event.target.value)} />
      <Caption>{kind.text.inputCaption}</Caption>
    </Label>
    {state.error === 'empty' && <Notice $tone="warn">Type or paste some text first.</Notice>}
    {state.phone === 'mobile' ? (
      <Notice $tone="info">You can also type on your phone. Both sides show the same text.</Notice>
    ) : (
      <Row>
        <SmallButton type="button" disabled={!mobile.isConnected} onClick={() => dispatch({ type: 'type-on-phone' })}>
          Type on my phone instead
        </SmallButton>
      </Row>
    )}
    <PrimaryButton type="button" disabled={!mobile.isConnected} onClick={start}>
      {kind.text.start}
    </PrimaryButton>
  </>
);

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
  return <InputView {...props} mobile={mobile} onEdit={content => dispatch({ type: 'edit', content })} start={() => start(mobile)} />;
};

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
  return <InputView {...props} mobile={mobile} onEdit={onEdit} start={() => start(mobile)} />;
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
  const label = kind.text.resultLabel.toLowerCase();
  return (
    <>
      <NotConnected mobile={mobile} />
      <Notice $tone="success">Received from your phone.</Notice>
      <Label>
        {kind.text.resultLabel}
        <TextArea rows={6} readOnly value={state.result} />
        <Caption>{kind.text.resultCaption}</Caption>
      </Label>
      <Row>
        <SmallButton type="button" onClick={async () => setMessage(await insertIntoPage(label, state.result, domain))}>
          Insert into page
        </SmallButton>
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

export const PhoneCryptoTool: React.FC<ToolProps & { kind: CryptoKind }> = ({ kind, domain, exit }) => {
  const [state, dispatch] = useReducer(cryptoReducer, initialCryptoState);
  // A stage or phone-screen change mounts a different view, so the phone gets that screen's form.
  const view = (() => {
    switch (state.stage) {
      case 'input':
        return state.phone === 'mobile' ? (
          <InputOnMobile key="input-mobile" kind={kind} state={state} dispatch={dispatch} exit={exit} />
        ) : (
          <InputOnComputer key="input-computer" kind={kind} state={state} dispatch={dispatch} exit={exit} />
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
