// Transfer form data, in the panel's design. Same behaviour on the phone as the popup tool
// (src/app/form-data-transfer): the same form id, fields, Show/Hide and Back. In the panel a
// value can also go straight into the focused field on the page, so the popup's copy-and-cache
// workaround is not needed here.
import React, { useEffect, useState } from 'react';
import type { FormField } from 'global-input-react';
import * as storage from '../../../app/storage';
import { FIELDS, buildFormFields, getNextVisibilityValue, sendVisibility, useConnectMobile } from '../../../app/form-data-transfer/mobile-ui';
import { Button, Card, Notice, SectionLabel, Text } from '../../ui/components';
import { Caption, Label, Row, Select, SmallButton, TextArea, TextInput } from '../../ui/controls';
import type { ToolProps } from '../registry';
import { AUTO_HIDE_MS, useAutoHide } from '../shared/autoHide';
import { useActiveHost } from '../shared/useActiveHost';
import { copyToClipboard, insertIntoPage } from '../shared/pageInsert';
import type { ToolMessage } from '../shared/pageInsert';
import { FIELD_KINDS, addField, isMultiLine, removeField, setFieldValue } from './fields';
import type { FieldKind } from './fields';

export const FormTransferTool: React.FC<ToolProps> = ({ domain, exit }) => {
  const [site, setSite] = useState(domain);
  const [configId, setConfigId] = useState(0);
  const [fields, setFields] = useState<FormField[]>(() => buildFormFields(domain));
  const [visibility, setVisibility] = useState(FIELDS.visibility.options[0]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<ToolMessage>(null);
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

  // Loads the site's own fields and sends them to the phone. Nothing is saved: saving here
  // would store them under the previous site.
  const changeSite = (value: string) => {
    setSite(value);
    setFields(buildFormFields(value));
    setConfigId(id => id + 1);
  };

  // Opened without a site (the Sign in tab did not know it): ask the active tab.
  const { host: activeHost } = useActiveHost(domain);
  useEffect(() => {
    if (!domain && activeHost && !site) {
      changeSite(activeHost);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHost]);
  const pageHost = domain || activeHost;

  const toggleVisibility = () => {
    const next = getNextVisibilityValue(visibility);
    setVisibility(next);
    sendVisibility(mobile, next);
  };
  useAutoHide(!hidden, () => {
    if (visibility.value !== 0) {
      toggleVisibility();
    }
  });

  const typeValue = (field: FormField, index: number, value: string) => {
    onFormModified(setFieldValue(fields, field.id as string, value), false);
    mobile.sendValue(field.id as string, value, index);
  };

  const insert = async (field: FormField) => setMessage(await insertIntoPage(String(field.label), String(field.value ?? ''), pageHost));

  const copy = async (field: FormField) => setMessage(await copyToClipboard(String(field.label), String(field.value ?? '')));

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
        <Caption>Your phone offers the values it saved for this site. Each site keeps its own list of fields.</Caption>
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
      {!hidden && <Caption>Values hide again after {AUTO_HIDE_MS / 1000} seconds, or when the panel is hidden.</Caption>}

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
