// Per-site settings: on the site card (collapsed under "Site settings") and as a list on the
// Settings page.
import React, { useState } from 'react';
import styled from 'styled-components';
import { siteSettingsStore } from '../adapters/siteSettings';
import type { SiteSettings } from '../core/signInController';
import { Button, Field, SectionLabel, Text } from './components';
import { color, radius } from './theme';

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

const useSiteSettings = (host: string) => {
  const [settings, setSettings] = useState<SiteSettings>(() => siteSettingsStore.get(host));
  const [forHost, setForHost] = useState(host);
  if (forHost !== host) {
    setForHost(host);
    setSettings(siteSettingsStore.get(host));
  }
  const change = (next: SiteSettings) => {
    siteSettingsStore.set(host, next);
    setSettings(next);
  };
  return [settings, change] as const;
};

interface SiteControlsProps {
  host: string;
  // Offered when the form on the page was found automatically.
  canSaveRule: boolean;
  onSaveRule: () => void;
  onDetectionChanged: () => void;
}

export const SiteControls: React.FC<SiteControlsProps> = ({ host, canSaveRule, onSaveRule, onDetectionChanged }) => {
  const [settings, change] = useSiteSettings(host);
  return (
    <Details>
      <summary>Site settings</summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field>
          Sign in automatically after filling
          <input type="checkbox" checked={settings.autoSubmit} onChange={event => change({ ...settings, autoSubmit: event.target.checked })} />
        </Field>
        <Field>
          Find sign-in forms on this site
          <input
            type="checkbox"
            checked={settings.detect}
            onChange={event => {
              change({ ...settings, detect: event.target.checked });
              onDetectionChanged();
            }}
          />
        </Field>
        {canSaveRule && (
          <>
            <Button type="button" onClick={onSaveRule}>
              Save as page rule
            </Button>
            <Text style={{ fontSize: 12 }}>Remembers exactly where this form's fields are. You can edit it in Tools, then Page control.</Text>
          </>
        )}
      </div>
    </Details>
  );
};

export const TurnDetectionOn: React.FC<{ host: string; onDetectionChanged: () => void }> = ({ host, onDetectionChanged }) => {
  const [settings, change] = useSiteSettings(host);
  return (
    <Button
      type="button"
      onClick={() => {
        change({ ...settings, detect: true });
        onDetectionChanged();
      }}
    >
      Turn detection on
    </Button>
  );
};

const SiteRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid ${color.lineSoft};
`;

const describe = (settings: SiteSettings) =>
  [settings.autoSubmit ? 'Signs in automatically' : '', settings.detect ? '' : 'Detection off'].filter(Boolean).join(' · ');

export const SiteSettingsList: React.FC<{ onChanged: () => void }> = ({ onChanged }) => {
  const [sites, setSites] = useState(siteSettingsStore.list);
  if (!sites.length) {
    return <Text>No site has its own settings. Change them from the site card while you are on a sign-in page.</Text>;
  }
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {sites.map(({ host, settings }) => (
        <SiteRow key={host}>
          <div style={{ minWidth: 0 }}>
            <div style={{ wordBreak: 'break-all' }}>{host}</div>
            <div style={{ fontSize: 12, color: color.muted }}>{describe(settings)}</div>
          </div>
          <Button
            type="button"
            style={{ borderRadius: radius.control, flex: 'none' }}
            onClick={() => {
              siteSettingsStore.set(host, { autoSubmit: false, detect: true });
              setSites(siteSettingsStore.list());
              onChanged();
            }}
          >
            Reset
          </Button>
        </SiteRow>
      ))}
    </ul>
  );
};

export const SitesSection: React.FC<{ onChanged: () => void }> = ({ onChanged }) => (
  <>
    <SectionLabel>Sites</SectionLabel>
    <SiteSettingsList onChanged={onChanged} />
  </>
);
