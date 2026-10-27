// Transfer form data, in the panel's design. Same behaviour on the phone as the popup tool
// (src/app/form-data-transfer): the same form id, fields, Show/Hide and Back. In the panel a
// value can also go straight into the focused field on the page, so the popup's copy-and-cache
// workaround is not needed here.
import React, { useState } from 'react';
import styled from 'styled-components';
import type { FormField } from 'global-input-react';
import * as storage from '../../../app/storage';
import { FIELDS, buildFormFields, getNextVisibilityValue, sendVisibility, useConnectMobile } from '../../../app/form-data-transfer/mobile-ui';
import { activeTabId, chromePagePort } from '../../adapters/chromePage';
import { Button, Card, Notice, SectionLabel, Text } from '../../ui/components';
import { color, radius } from '../../ui/theme';
import type { ToolProps } from '../registry';
import { FIELD_KINDS, addField, isMultiLine, removeField, setFieldValue } from './fields';
import type { FieldKind } from './fields';

const controlStyle = `
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${color.control};
  border-radius: ${radius.control};
  padding: 8px 10px;
  font: inherit;
  color: ${color.ink};
  background: ${color.surface};
  &:focus {
    outline: 2px solid ${color.primary};
    outline-offset: 0;
    border-color: ${color.primary};
  }
`;
const TextInput = styled.input`
  ${controlStyle}
  height: 36px;
`;
const TextArea = styled.textarea`
  ${controlStyle}
  resize: vertical;
`;
const Select = styled.select`
  ${controlStyle}
  height: 36px;
`;
const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
`;
const Row = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;
const SmallButton = styled(Button)`
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
`;

type Message = { tone: 'success' | 'warn' | 'info'; text: string } | null;

const insertMessage = (label: string, domain: string, reply: Awaited<ReturnType<typeof chromePagePort.fillFocused>>): Message => {
  if (!reply) {
    return { tone: 'warn', text: 'This tab cannot be used. Reload the page and try again.' };
  }
  if (reply.status === 'success') {
    return { tone: 'success', text: `Inserted ${label} into the focused field on ${domain}.` };
  }
  return reply.reason === 'host-mismatch'
    ? { tone: 'warn', text: `The active tab is no longer on ${domain}, so nothing was inserted.` }
    : { tone: 'warn', text: 'Click into a field on the page first, then Insert again.' };
};

export const FormTransferTool: React.FC<ToolProps> = ({ domain, exit }) => {
  const [site, setSite] = useState(domain);
  const [configId, setConfigId] = useState(0);
  const [fields, setFields] = useState<FormField[]>(() => buildFormFields(domain));
  const [visibility, setVisibility] = useState(FIELDS.visibility.options[0]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newKind, setNewKind] = useState<FieldKind>('single-line');
  const hidden = visibility.value === 0;

  // A changed field list is saved for the site and sent to the phone as a new form.
  const onFormModified = (next: FormField[], structureChanged: boolean) => {
    if (structureChanged) {
      storage.saveFormFields(site, next);
      setConfigId(id => id + 1);
    }
    setFields(next);
  };

  const mobile = useConnectMobile({ domain: site, formFields: fields, configId, visibility, setVisibility, onFormModified, back: exit });

  const changeSite = (value: string) => {
    setSite(value);
    onFormModified(buildFormFields(value), true);
  };

  const toggleVisibility = () => {
    const next = getNextVisibilityValue(visibility);
    setVisibility(next);
    sendVisibility(mobile, next);
  };

  const typeValue = (field: FormField, index: number, value: string) => {
    onFormModified(setFieldValue(fields, field.id as string, value), false);
    mobile.sendValue(field.id as string, value, index);
  };

  const insert = async (field: FormField) => {
    const value = String(field.value ?? '');
    if (!value) {
      setMessage({ tone: 'warn', text: `${field.label} is empty.` });
      return;
    }
    const tabId = await activeTabId();
    if (tabId === null || !domain) {
      setMessage({ tone: 'warn', text: 'Open a web page in this window first.' });
      return;
    }
    setMessage(insertMessage(String(field.label), domain, await chromePagePort.fillFocused(tabId, value, domain)));
  };

  const copy = async (field: FormField) => {
    try {
      await navigator.clipboard.writeText(String(field.value ?? ''));
      setMessage({ tone: 'success', text: `Copied ${field.label}.` });
    } catch (error) {
      setMessage({ tone: 'warn', text: 'Could not copy. Use Insert instead.' });
    }
  };

  const add = () => {
    const result = addField(fields, newLabel, newKind);
    if ('error' in result) {
      setMessage({ tone: 'warn', text: result.error });
      return;
    }
    onFormModified(result.fields, true);
    setNewLabel('');
    setMessage(null);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!mobile.isConnected && (
        <Notice $tone="info">Connect your phone in the Sign in tab to send these values to and from your phone.</Notice>
      )}
      <Label>
        Site
        <TextInput value={site} onChange={event => changeSite(event.target.value)} placeholder="example.com" />
        <span style={{ fontWeight: 400, fontSize: 12, color: color.muted }}>
          Your phone offers the values it saved for this site. Each site keeps its own list of fields.
        </span>
      </Label>

      <Row style={{ justifyContent: 'space-between' }}>
        <SectionLabel>Fields</SectionLabel>
        <Row>
          <SmallButton type="button" aria-pressed={!hidden} onClick={toggleVisibility}>
            {hidden ? 'Show values' : 'Hide values'}
          </SmallButton>
          <SmallButton type="button" aria-pressed={editing} onClick={() => setEditing(!editing)}>
            {editing ? 'Done editing' : 'Edit fields'}
          </SmallButton>
        </Row>
      </Row>

      {fields.map((field, index) => {
        const id = `transfer-${field.id}`;
        const value = String(field.value ?? '');
        return (
          <Card key={field.id as string} style={{ gap: 8, padding: 12 }}>
            <label htmlFor={id} style={{ fontWeight: 600 }}>
              {field.label}
            </label>
            {isMultiLine(field) && !hidden ? (
              <TextArea id={id} rows={field.nLines} value={value} onChange={event => typeValue(field, index, event.target.value)} />
            ) : (
              <TextInput
                id={id}
                type={hidden ? 'password' : 'text'}
                autoComplete="off"
                value={value}
                onChange={event => typeValue(field, index, event.target.value)}
              />
            )}
            <Row>
              {editing ? (
                <SmallButton type="button" onClick={() => onFormModified(removeField(fields, field.id as string), true)}>
                  Remove field
                </SmallButton>
              ) : (
                <>
                  <SmallButton type="button" onClick={() => insert(field)} title="Write this value into the field that has focus on the page">
                    Insert into page
                  </SmallButton>
                  <SmallButton type="button" onClick={() => copy(field)}>
                    Copy
                  </SmallButton>
                </>
              )}
            </Row>
          </Card>
        );
      })}

      {editing && (
        <Card style={{ padding: 12 }}>
          <SectionLabel as="h3">Add a field</SectionLabel>
          <Label>
            Name
            <TextInput value={newLabel} onChange={event => setNewLabel(event.target.value)} placeholder="Account number" />
          </Label>
          <Label>
            Kind
            <Select value={newKind} onChange={event => setNewKind(event.target.value as FieldKind)}>
              {FIELD_KINDS.map(kind => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </Select>
          </Label>
          <Button type="button" onClick={add}>
            Add field
          </Button>
        </Card>
      )}

      {message && (
        <Notice $tone={message.tone} role="status">
          {message.text}
        </Notice>
      )}
      <Text style={{ fontSize: 12 }}>Values you type here appear on your phone as you type, and the other way round. They are not stored.</Text>
    </div>
  );
};
