// The phone screen of the processing stage: the same form as the popup tool's
// encrypt-content / decrypt-content page.
import { useMobile } from 'global-input-mobile';
import type { CryptoKind } from './kinds';

const INFO = { id: 'info', type: 'info', value: '' };
const BACK = { id: 'backToContent', label: 'Back', type: 'button', viewId: 'row1' };

interface Handlers {
  onResult: (result: string) => void;
  onBack: () => void;
}

export const useProcessOnPhone = (kind: CryptoKind, content: string, { onResult, onBack }: Handlers) => {
  const mobile = useMobile(() => ({ form: { title: kind.phoneTitle, fields: [{ ...kind.processField, value: content }, INFO, BACK] } }), true);
  mobile.setOnchange(({ field }) => {
    switch (field.id) {
      case kind.processField.id:
        if (!field.value) {
          mobile.sendValue(INFO.id, { style: { color: 'red' }, content: kind.text.failed });
        }
        onResult((field.value as string) || '');
        break;
      case BACK.id:
        onBack();
        break;
    }
  });
  return mobile;
};
