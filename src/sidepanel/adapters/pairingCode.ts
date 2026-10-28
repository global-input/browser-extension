// The pairing code a phone scans to take this browser's keys. It is built by the Global Input
// library, as the phone expects it, with the pairing name added. The library encrypts it with
// a key every copy of the library has, so the code itself must be treated as secret.
import { createMessageConnector } from 'global-input-react';
import type { PairingSettings } from 'global-input-mobile';

// The library's CodeData type doesn't list extra fields, but the code carries any it is given.
type PairingCodeData = NonNullable<Parameters<ReturnType<typeof createMessageConnector>['buildPairingData']>[0]>;

export const buildPairingCode = (pairing: PairingSettings): string => {
  const connector = createMessageConnector();
  if (pairing.securityGroup) connector.setSecurityGroup(pairing.securityGroup);
  if (pairing.codeKey) connector.setCodeAES(pairing.codeKey);
  return connector.buildPairingData((pairing.name ? { name: pairing.name } : {}) as PairingCodeData);
};
