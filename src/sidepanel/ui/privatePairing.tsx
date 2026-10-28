// Settings → Advanced → Private pairing. The Security Group Key and Code Key are the secrets
// shared with paired phones, so they and the pairing code stay hidden until the user presses
// Show, and hide again by themselves.
import React, { useState } from 'react';
import styled from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { generateRandomString } from 'global-input-react';
import { isPrivatelyPaired } from 'global-input-mobile';
import type { ConnectionRecord, PairingSettings } from 'global-input-mobile';
import { checkKeysDraft, defaultPairingName, newPairing, withDefaultKeys, withPairing } from '../core/pairing';
import type { KeysDraft } from '../core/pairing';
import { buildPairingCode } from '../adapters/pairingCode';
import { AUTO_HIDE_MS, useAutoHide } from '../tools/shared/autoHide';
import { copyToClipboard } from '../tools/shared/pageInsert';
import type { ToolMessage } from '../tools/shared/pageInsert';
import { Notice, SectionLabel, Text } from './components';
import { Caption, Concealed, Label, Row, SmallButton, TextInput } from './controls';
import { color, font, radius } from './theme';

type View = 'status' | 'new-keys' | 'code' | 'enter-keys' | 'confirm-default';

const AUTO_HIDE_TEXT = `Hides again after ${AUTO_HIDE_MS / 1000} seconds or when the panel is hidden.`;

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 6px;
`;

const Status = styled.div<{ $private: boolean }>`
  padding: 10px 12px;
  border-radius: ${radius.control};
  background: ${props => (props.$private ? color.successBg : color.neutralBg)};
  color: ${props => (props.$private ? color.successInk : color.inkSoft)};
  line-height: 1.45;
`;

// Typed keys show as dots, without a password field, so password managers stay out of it.
const KeyInput = styled(TextInput)<{ $hidden: boolean }>`
  font-family: ${font.mono};
  -webkit-text-security: ${props => (props.$hidden ? 'disc' : 'none')};
`;

const KeyValue = styled.code`
  display: block;
  padding: 8px 10px;
  border-radius: ${radius.control};
  background: ${color.canvas};
  font-family: ${font.mono};
  word-break: break-all;
`;

const formatDate = (time?: number) =>
  time ? new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

interface Props {
  record: ConnectionRecord;
  onSave: (record: ConnectionRecord) => boolean;
}

export const PrivatePairingSection: React.FC<Props> = ({ record, onSave }) => {
  const [view, setView] = useState<View>('status');
  const [message, setMessage] = useState<ToolMessage>(null);
  const paired = isPrivatelyPaired(record);

  const go = (next: View) => {
    setMessage(null);
    setView(next);
  };

  const save = (next: ConnectionRecord, then: View, done: ToolMessage) => {
    if (!onSave(next)) {
      setMessage({ tone: 'warn', text: 'Could not save the settings in this browser.' });
      return;
    }
    setView(then);
    setMessage(done);
  };

  return (
    <Group aria-labelledby="private-pairing-heading">
      <SectionLabel id="private-pairing-heading">Private pairing</SectionLabel>
      <Caption>
        The Security Group Key lets the relay accept only your paired phones, and the Code Key encrypts this browser's QR
        codes so only they can read them. Keep both secret.
      </Caption>
      {view === 'status' && <StatusView pairing={record.pairing} paired={paired} go={go} />}
      {view === 'new-keys' && (
        <NewKeysView
          paired={paired}
          name={record.pairing.name}
          onCancel={() => go('status')}
          onMake={name =>
            save(withPairing(record, newPairing(generateRandomString, Date.now(), name)), 'code', {
              tone: 'success',
              text: 'New keys saved. The panel has started a new connection with them.',
            })
          }
        />
      )}
      {view === 'code' && <PairingCodeView pairing={record.pairing} onDone={() => go('status')} />}
      {view === 'enter-keys' && (
        <EnterKeysView
          pairing={record.pairing}
          onCancel={() => go('status')}
          onSave={pairing =>
            save(withPairing(record, pairing), 'status', {
              tone: 'success',
              text: 'Keys saved. Phones with the same keys can connect; scan the new QR code.',
            })
          }
        />
      )}
      {view === 'confirm-default' && (
        <>
          <Notice $tone="warn">
            Go back to the default keys? Any Global Input App can then read this browser's QR codes. Phones paired with this
            browser connect again only after going back to the default settings in the app.
          </Notice>
          <Row>
            <SmallButton
              onClick={() => save(withDefaultKeys(record), 'status', { tone: 'success', text: 'Using the default keys again. Scan the new QR code.' })}
            >
              Use default keys
            </SmallButton>
            <SmallButton onClick={() => go('status')}>Cancel</SmallButton>
          </Row>
        </>
      )}
      {message && <Notice $tone={message.tone}>{message.text}</Notice>}
    </Group>
  );
};

const StatusView: React.FC<{ pairing: PairingSettings; paired: boolean; go: (view: View) => void }> = ({ pairing, paired, go }) => {
  const [shown, setShown] = useState(false);
  useAutoHide(shown, () => setShown(false));
  if (!paired) {
    return (
      <>
        <Status $private={false}>
          <strong>Default keys.</strong> Any Global Input App can read this browser's QR codes. Once your phone has connected,
          the session accepts no other phone.
        </Status>
        <Row>
          <SmallButton onClick={() => go('new-keys')}>Pair a phone</SmallButton>
          <SmallButton onClick={() => go('enter-keys')}>Enter keys</SmallButton>
        </Row>
      </>
    );
  }
  const detail = [pairing.name, pairing.pairedAt && `keys made ${formatDate(pairing.pairedAt)}`].filter(Boolean).join(' · ');
  return (
    <>
      <Status $private>
        <strong>Private keys.</strong> Only phones paired with this browser can connect.
        {detail && <div style={{ fontSize: 12 }}>{detail}</div>}
      </Status>
      {shown ? (
        <>
          <Label as="div">
            Security Group Key
            <KeyValue>{pairing.securityGroup ?? 'Default'}</KeyValue>
          </Label>
          <Label as="div">
            Code Key
            <KeyValue>{pairing.codeKey ?? 'Default'}</KeyValue>
          </Label>
          <Caption>{AUTO_HIDE_TEXT}</Caption>
        </>
      ) : (
        <Concealed label="The keys" hint="Keys hidden. Press Show keys to see them." />
      )}
      <Row>
        <SmallButton onClick={() => go('code')}>Pair another phone</SmallButton>
        <SmallButton onClick={() => setShown(!shown)}>{shown ? 'Hide keys' : 'Show keys'}</SmallButton>
      </Row>
      <Row>
        <SmallButton onClick={() => go('new-keys')}>Make new keys</SmallButton>
        <SmallButton onClick={() => go('enter-keys')}>Enter keys</SmallButton>
        <SmallButton onClick={() => go('confirm-default')}>Use default keys</SmallButton>
      </Row>
    </>
  );
};

const NewKeysView: React.FC<{ paired: boolean; name?: string; onCancel: () => void; onMake: (name: string) => void }> = ({
  paired, name, onCancel, onMake,
}) => {
  const [draft, setDraft] = useState(name || defaultPairingName(navigator.userAgent));
  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        onMake(draft.trim() || defaultPairingName(navigator.userAgent));
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <Text>This browser makes two new random keys, then shows a pairing code for your phone to scan.</Text>
      <Label>
        Name shown on your phone
        <TextInput value={draft} maxLength={64} onChange={event => setDraft(event.target.value)} />
      </Label>
      <Caption>
        {paired ? 'Phones paired with the current keys stop connecting until they pair again. ' : ''}
        The panel starts a new connection, so a connected phone is disconnected.
      </Caption>
      <Row>
        <SmallButton type="submit">Make keys and show the pairing code</SmallButton>
        <SmallButton type="button" onClick={onCancel}>
          Cancel
        </SmallButton>
      </Row>
    </form>
  );
};

const PairingCodeView: React.FC<{ pairing: PairingSettings; onDone: () => void }> = ({ pairing, onDone }) => {
  const [shown, setShown] = useState(false);
  const [message, setMessage] = useState<ToolMessage>(null);
  useAutoHide(shown, () => setShown(false));
  const code = buildPairingCode(pairing);

  const copy = async () => {
    const result = await copyToClipboard('the pairing code', code);
    setMessage(result?.tone === 'success'
      ? { tone: 'success', text: 'Copied the pairing code. In the Global Input App on this device, use From Clipboard.' }
      : { tone: 'warn', text: 'Could not copy the pairing code. Show it and scan it instead.' });
  };

  return (
    <>
      <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, color: color.inkSoft }}>
        <li>Open the Global Input App on your phone and tap Scan.</li>
        <li>Press Show, scan the pairing code, and accept the new settings on your phone.</li>
        <li>Press Close pairing code, then scan the connection QR code as usual.</li>
      </ol>
      <div style={{ alignSelf: 'center', padding: 12, border: `1px solid ${color.line}`, borderRadius: 12 }}>
        {shown ? (
          <QRCodeSVG value={code} size={200} level="M" aria-label="Pairing code" />
        ) : (
          <div style={{ width: 200 }}>
            <Concealed label="The pairing code" hint="It holds your keys, so it stays hidden from cameras until you press Show." />
          </div>
        )}
      </div>
      {shown && <Caption>{AUTO_HIDE_TEXT}</Caption>}
      <Row>
        <SmallButton onClick={() => setShown(!shown)}>{shown ? 'Hide' : 'Show'}</SmallButton>
        <SmallButton onClick={copy}>Copy pairing code</SmallButton>
        <SmallButton onClick={onDone}>Close pairing code</SmallButton>
      </Row>
      {message && <Notice $tone={message.tone}>{message.text}</Notice>}
    </>
  );
};

const EnterKeysView: React.FC<{ pairing: PairingSettings; onCancel: () => void; onSave: (pairing: PairingSettings) => void }> = ({
  pairing, onCancel, onSave,
}) => {
  const [draft, setDraft] = useState<KeysDraft>({ securityGroup: '', codeKey: '', name: pairing.name ?? '' });
  const [shown, setShown] = useState(false);
  const [error, setError] = useState('');
  useAutoHide(shown, () => setShown(false));
  const edit = (change: Partial<KeysDraft>) => {
    setDraft(current => ({ ...current, ...change }));
    setError('');
  };
  return (
    <form
      noValidate
      onSubmit={event => {
        event.preventDefault();
        const check = checkKeysDraft(draft, Date.now());
        if ('error' in check) setError(check.error);
        else onSave(check.pairing);
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <Text>Use keys made elsewhere, for example on your other computer. A blank key uses the default for that key.</Text>
      <Label>
        Security Group Key
        <KeyInput $hidden={!shown} value={draft.securityGroup} autoComplete="off" spellCheck={false} onChange={event => edit({ securityGroup: event.target.value })} />
      </Label>
      <Label>
        Code Key
        <KeyInput $hidden={!shown} value={draft.codeKey} autoComplete="off" spellCheck={false} onChange={event => edit({ codeKey: event.target.value })} />
      </Label>
      <Label>
        Name shown on your phone
        <TextInput value={draft.name} maxLength={64} placeholder={defaultPairingName(navigator.userAgent)} onChange={event => edit({ name: event.target.value })} />
      </Label>
      <Caption>Saving starts a new connection. Phones need the same keys to connect.</Caption>
      <Row>
        <SmallButton type="submit">Save keys</SmallButton>
        <SmallButton type="button" onClick={() => setShown(!shown)}>
          {shown ? 'Hide keys' : 'Show keys'}
        </SmallButton>
        <SmallButton type="button" onClick={onCancel}>
          Cancel
        </SmallButton>
      </Row>
      {error && <Notice $tone="warn">{error}</Notice>}
    </form>
  );
};
