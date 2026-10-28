// Settings → Advanced: connection settings most people never change. Collapsed by default.
// Relay server: where messages are routed. Not secret, since the relay only forwards
// end-to-end encrypted messages; saving starts a new session through the new server.
// Private pairing (privatePairing.tsx): the keys shared with paired phones.
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { isPrivatelyPaired, loadConnectionRecord, onConnectionRecordChange, saveConnectionRecord } from 'global-input-mobile';
import type { ConnectionRecord, RelaySettings } from 'global-input-mobile';
import { PrivatePairingSection } from './privatePairing';
import { checkRelayDraft, describeRelay, relayDraftOf, sameRelay } from '../core/relay';
import type { RelayDraft } from '../core/relay';
import type { ToolMessage } from '../tools/shared/pageInsert';
import { Notice, SectionLabel, Text } from './components';
import { Caption, Label, Row, SmallButton, TextInput } from './controls';
import { color } from './theme';

const Details = styled.details`
  border-top: 1px solid ${color.lineSoft};
  padding-top: 10px;
  summary {
    cursor: pointer;
    font-weight: 600;
    color: ${color.inkSoft};
  }
  &[open] summary {
    margin-bottom: 10px;
  }
`;

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 6px;
`;

export const useConnectionRecord = (): ConnectionRecord => {
  const [record, setRecord] = useState(loadConnectionRecord);
  useEffect(() => onConnectionRecordChange(setRecord), []);
  return record;
};

export const AdvancedSettings: React.FC = () => {
  const record = useConnectionRecord();
  const summary = `${describeRelay(record.relay)} · ${isPrivatelyPaired(record) ? 'private keys' : 'default keys'}`;
  return (
    <Details>
      <summary>
        Advanced <Caption>({summary})</Caption>
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Text>For your own relay server or private pairing. Most people never need to change these.</Text>
        <RelayServerSection relay={record.relay} onSave={relay => saveConnectionRecord({ ...record, relay })} />
        <PrivatePairingSection record={record} onSave={saveConnectionRecord} />
      </div>
    </Details>
  );
};

const RelayServerSection: React.FC<{ relay: RelaySettings; onSave: (relay: RelaySettings) => boolean }> = ({ relay, onSave }) => {
  const [draft, setDraft] = useState<RelayDraft>(() => relayDraftOf(relay));
  const [message, setMessage] = useState<ToolMessage>(null);

  // Follow changes saved elsewhere (another panel window).
  useEffect(() => setDraft(relayDraftOf(relay)), [relay.url, relay.apikey]);

  const edit = (change: Partial<RelayDraft>) => {
    setDraft(current => ({ ...current, ...change }));
    setMessage(null);
  };

  const save = (next: RelaySettings) => {
    if (!onSave(next)) {
      setMessage({ tone: 'warn', text: 'Could not save the settings in this browser.' });
      return;
    }
    setMessage({ tone: 'success', text: `Saved. Connecting through ${next.url ? new URL(next.url).host : 'the default server'}; scan the new QR code.` });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const check = checkRelayDraft(draft);
    if ('error' in check) {
      setMessage({ tone: 'warn', text: check.error });
      return;
    }
    if (sameRelay(check.relay, relay)) {
      setMessage({ tone: 'info', text: 'Nothing changed.' });
      return;
    }
    save(check.relay);
  };

  const isDefault = !relay.url && !relay.apikey;
  const changed = !sameRelay({ url: draft.url.trim(), apikey: draft.apikey.trim() }, relay);

  return (
    <Group aria-labelledby="relay-server-heading">
      <SectionLabel id="relay-server-heading">Relay server</SectionLabel>
      <Caption>
        The server that passes messages between your phone and this browser. It only forwards end-to-end encrypted
        messages and stores nothing, so these values are not secret: they direct and identify the traffic.
      </Caption>
      <form noValidate onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Label>
          WebSocket server URL
          <TextInput
            type="url"
            value={draft.url}
            placeholder="Default: https://globalinput.co.uk"
            autoComplete="off"
            spellCheck={false}
            onChange={event => edit({ url: event.target.value })}
          />
          <Caption>Leave blank for the default server. You can run your own, even on an untrusted network.</Caption>
        </Label>
        <Label>
          API key
          <TextInput
            value={draft.apikey}
            placeholder="Default"
            autoComplete="off"
            spellCheck={false}
            onChange={event => edit({ apikey: event.target.value })}
          />
          <Caption>Identifies this browser's connections to the server above. Leave blank for the server's default key.</Caption>
        </Label>
        <Caption>Saving starts a new connection, so your phone needs to scan the QR code again.</Caption>
        <Row>
          <SmallButton type="submit" disabled={!changed}>
            Save
          </SmallButton>
          {!isDefault && (
            <SmallButton type="button" onClick={() => save({})}>
              Use the default server
            </SmallButton>
          )}
        </Row>
      </form>
      {message && <Notice $tone={message.tone}>{message.text}</Notice>}
    </Group>
  );
};
