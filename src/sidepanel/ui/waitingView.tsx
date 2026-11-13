// Shown after the phone left, while it can still come back from the app's History. No QR code
// here: the phone already has the session, and the code would only show the key to the room.
import React from 'react';
import type { PhoneConnection } from '../adapters/usePhoneConnection';
import { Button, Notice, Text, Title } from './components';
import { formatTime } from './progress';
import { color } from './theme';

export const WaitingView: React.FC<{ connection: PhoneConnection; onReset: () => void; keptWhileClosed: boolean }> = ({
  connection,
  onReset,
  keptWhileClosed,
}) => (
  <>
    <Title>Waiting for your phone</Title>
    <Text>Open the Global Input App, tap History, then tap this session.</Text>
    {connection.lastConnectedAt !== null && (
      <Text style={{ color: color.muted }}>Last connected at {formatTime(connection.lastConnectedAt)}</Text>
    )}
    {keptWhileClosed && (
      <Text style={{ fontSize: 12, color: color.muted }}>
        Tip: name this session in the app's History to keep it in the list. You can close this panel; the session stays until you
        press Reset or quit the browser.
      </Text>
    )}
    {connection.service === 'error' && <Notice $tone="warn">Could not reach the Global Input service. Trying again…</Notice>}
    {connection.deniedOtherPhone && (
      <Notice $tone="warn">
        Another phone tried to connect. Only the phone that connected before can come back. To connect a different phone, press Reset.
      </Notice>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      <Button type="button" onClick={onReset}>
        Reset
      </Button>
      <Text style={{ fontSize: 12, color: color.muted }}>
        Reset starts a new connection with a new QR code. The current session can then no longer be used.
      </Text>
    </div>
  </>
);
