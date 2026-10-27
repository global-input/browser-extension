import { describe, expect, it } from 'vitest';
import { addField, fieldIdFor, removeField, setFieldValue } from './fields';

const base = [{ id: 'username', label: 'Username', value: '' }];

describe('form transfer fields', () => {
  it('adds a field with an id made from its name', () => {
    const result = addField(base, '  Account  number ', 'password');
    expect('fields' in result && result.fields[1]).toEqual({ id: 'account_number', label: 'Account  number', type: 'secret', value: '', nLines: 1 });
    expect(fieldIdFor('Notes for later')).toBe('notes_for_later');
  });

  it('makes a multi-line field five lines high', () => {
    const result = addField(base, 'Note', 'multi-line');
    expect('fields' in result && result.fields[1]).toMatchObject({ type: 'text', nLines: 5 });
  });

  it('refuses an empty name or a duplicate', () => {
    expect(addField(base, '   ', 'single-line')).toEqual({ error: 'Give the field a name.' });
    expect(addField(base, 'username', 'single-line')).toEqual({ error: 'There is already a field called "username".' });
  });

  it('removes a field and sets a value without changing the others', () => {
    const two = [...base, { id: 'note', label: 'Note', value: 'x' }];
    expect(removeField(two, 'username')).toEqual([{ id: 'note', label: 'Note', value: 'x' }]);
    expect(setFieldValue(two, 'username', 'me')[0].value).toBe('me');
    expect(setFieldValue(two, 'username', 'me')[1]).toBe(two[1]);
  });
});
