// The editable field list of the Transfer form data tool. The fields' layout is saved per
// site (src/app/storage saveFormFields), so the phone keeps offering the same form.
import type { FormField } from 'global-input-react';

export type FieldKind = 'single-line' | 'multi-line' | 'password';

export const FIELD_KINDS: { value: FieldKind; label: string }[] = [
  { value: 'single-line', label: 'Single line' },
  { value: 'multi-line', label: 'Multiple lines' },
  { value: 'password', label: 'Password' },
];

export const fieldIdFor = (label: string) => label.trim().replace(/\s+/g, '_').toLowerCase();

export const addField = (fields: FormField[], label: string, kind: FieldKind): { fields: FormField[] } | { error: string } => {
  const name = label.trim();
  if (!name) {
    return { error: 'Give the field a name.' };
  }
  const id = fieldIdFor(name);
  if (fields.some(field => field.id === id)) {
    return { error: `There is already a field called "${name}".` };
  }
  const field: FormField = {
    id,
    label: name,
    type: kind === 'password' ? 'secret' : 'text',
    value: '',
    nLines: kind === 'multi-line' ? 5 : 1,
  };
  return { fields: [...fields, field] };
};

export const removeField = (fields: FormField[], id: string) => fields.filter(field => field.id !== id);

export const setFieldValue = (fields: FormField[], id: string, value: string) =>
  fields.map(field => (field.id === id ? { ...field, value } : field));

export const isMultiLine = (field: FormField) => !!field.nLines && field.nLines > 1;
export const isSecret = (field: FormField) => field.type === 'secret';
