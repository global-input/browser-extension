import { describe, expect, it } from 'vitest';
import { PHONE_IDS, describeInput, phoneFormOf, phoneValueChangesOf, phoneValuesOf, valueKeyOf, phoneInputOf, phoneSignatureOf } from './phoneForm';
import type { PageModel } from '../../../shared/pageControlMessages';

const model: PageModel = {
  host: 'shop.example',
  title: 'Checkout',
  scope: 'page',
  groups: [
    {
      id: 'g1',
      title: 'Delivery',
      controls: [
        { id: 'c1', kind: 'text', label: 'Full name', value: 'Ada' },
        { id: 'c2', kind: 'secret', label: 'Card number' },
        { id: 'c3', kind: 'choice', label: 'Country', value: 'fr', options: [{ value: 'uk', label: 'UK' }, { value: 'fr', label: 'France' }] },
        { id: 'c4', kind: 'toggle', label: 'Gift wrap', value: true },
        { id: 'c5', kind: 'date', label: 'Delivery day', format: 'YYYY-MM-DD' },
        { id: 'c6', kind: 'button', label: 'Place order', primary: true },
      ],
    },
    { id: 'g2', title: 'Video', controls: [{ id: 'c7', kind: 'media', label: 'Tour', media: { playing: false, position: 12, duration: 90, volume: 0 } }] },
    { id: 'g3', title: 'Menu', controls: [{ id: 'c8', kind: 'link', label: 'Help' }, { id: 'c9', kind: 'range', label: 'Zoom', value: 3, min: 1, max: 5 }] },
  ],
  more: { links: 40, buttons: 2, fields: 0 },
};

describe('the phone form', () => {
  it('shows the controls in the page’s words, with their values but never a secret', () => {
    const { form } = phoneFormOf(model, 'Hello');
    expect(form.title).toBe('shop.example');
    expect(form.fields.map(field => [field.id, field.type])).toEqual([
      [PHONE_IDS.status, 'info'],
      ['g1', 'info'],
      ['c1', 'text'],
      ['c2', 'secret'],
      ['c3', 'list'],
      ['c4', 'list'],
      ['c5', 'text'],
      ['c6', 'button'],
      ['g2', 'info'],
      ['c7:play', 'button'],
      ['c7:position', 'range'],
      ['c7:volume', 'range'],
      ['g3', 'info'],
      ['c8', 'button'],
      ['c9', 'range'],
      [PHONE_IDS.more, 'button'],
      [PHONE_IDS.up, 'button'],
      [PHONE_IDS.down, 'button'],
      [PHONE_IDS.back, 'button'],
      [PHONE_IDS.analyse, 'button'],
      [PHONE_IDS.close, 'button'],
    ]);
    const field = (id: string) => form.fields.find(item => item.id === id)!;
    expect(field(PHONE_IDS.status).value).toBe('Hello');
    expect(field('c1').value).toBe('Ada');
    expect(field('c2').value).toBe('');
    expect(field('c3')).toMatchObject({ selectType: 'single', value: ['fr'], items: [{ value: 'uk', label: 'UK' }, { value: 'fr', label: 'France' }] });
    expect(field('c4')).toMatchObject({ selectType: 'multiple', value: ['on'], items: [{ value: 'on', label: 'Gift wrap' }] });
    expect(field('c5').label).toBe('Delivery day (YYYY-MM-DD)');
    expect(field('c8').label).toBe('Help →');
    expect(field('c9')).toMatchObject({ value: 3, minimumValue: 1, maximumValue: 5 });
    expect(field('c7:play').label).toBe('▶ Play – Tour');
    expect(field('c7:position')).toMatchObject({ value: 12, minimumValue: 0, maximumValue: 90 });
    expect(field('c7:volume')).toMatchObject({ value: 0, maximumValue: 100 });
    expect(field(PHONE_IDS.more).label).toBe('Show 30 more');
  });

  it('operates video and audio, and leaves out a position for live streams', () => {
    expect(phoneInputOf(model, 'c7:play', undefined)).toMatchObject({ type: 'media', operation: { type: 'toggle' } });
    expect(phoneInputOf(model, 'c7:position', 45)).toMatchObject({ type: 'media', operation: { type: 'seek', seconds: 45 } });
    expect(phoneInputOf(model, 'c7:volume', 60)).toMatchObject({ type: 'media', operation: { type: 'volume', percent: 60 } });
    expect(phoneInputOf(model, 'c1:play', undefined)).toBeNull();
    expect(phoneInputOf(model, PHONE_IDS.more, undefined)).toEqual({ type: 'more' });
    expect(describeInput(phoneInputOf(model, 'c7:play', undefined)!)).toBe('Played “Tour”');
    const live = { ...model, groups: [{ id: 'g1', title: 'Video', controls: [{ id: 'c1', kind: 'media' as const, label: 'Live', media: { playing: true, position: 5, volume: 50 } }] }] };
    expect(phoneFormOf(live).form.fields.map(item => item.id)).toContain('c1:volume');
    expect(phoneFormOf(live).form.fields.map(item => item.id)).not.toContain('c1:position');
    // Playing or pausing changes the button, so the phone gets a new form; the position doesn't.
    const paused = { ...live, groups: [{ ...live.groups[0], controls: [{ ...live.groups[0].controls[0], media: { playing: false, position: 5, volume: 50 } }] }] };
    const later = { ...live, groups: [{ ...live.groups[0], controls: [{ ...live.groups[0].controls[0], media: { playing: true, position: 60, volume: 50 } }] }] };
    expect(phoneSignatureOf(paused)).not.toBe(phoneSignatureOf(live));
    expect(phoneSignatureOf(later)).toBe(phoneSignatureOf(live));
  });

  it('turns phone input into page actions with values the page understands', () => {
    expect(phoneInputOf(model, 'c1', 'Grace')).toMatchObject({ type: 'control', value: 'Grace' });
    expect(phoneInputOf(model, 'c3', ['uk'])).toMatchObject({ type: 'control', value: 'uk' });
    expect(phoneInputOf(model, 'c4', [])).toMatchObject({ type: 'control', value: false });
    expect(phoneInputOf(model, 'c4', ['on'])).toMatchObject({ type: 'control', value: true });
    expect(phoneInputOf(model, 'c9', 4)).toMatchObject({ type: 'control', value: 4 });
    expect(phoneInputOf(model, 'c6', undefined)).toMatchObject({ type: 'control', value: undefined });
    expect(phoneInputOf(model, PHONE_IDS.down, undefined)).toEqual({ type: 'page', action: 'down' });
    expect(phoneInputOf(model, PHONE_IDS.close, undefined)).toEqual({ type: 'close' });
    expect(phoneInputOf(model, 'c99', 'x')).toBeNull();
    expect(phoneInputOf(null, 'c1', 'x')).toBeNull();
  });

  it('says what the phone did, without values', () => {
    const typing = phoneInputOf(model, 'c1', 'G')!;
    const press = phoneInputOf(model, 'c6', undefined)!;
    expect(describeInput(press)).toBe('Pressed “Place order”');
    expect(describeInput(typing)).toBe('Typing into “Full name”');
  });

  it('is resent only when the controls change, not their values', () => {
    const typed = { ...model, groups: [{ ...model.groups[0], controls: [{ ...model.groups[0].controls[0], value: 'Grace' }, ...model.groups[0].controls.slice(1)] }, ...model.groups.slice(1)] };
    expect(phoneSignatureOf(typed)).toBe(phoneSignatureOf(model));
    expect(phoneSignatureOf({ ...model, groups: model.groups.slice(1) })).not.toBe(phoneSignatureOf(model));
  });

  it('sends only the values the page changed by itself, not what the phone typed', () => {
    const shown = phoneValuesOf(model);
    expect(shown.has('c2')).toBe(false);
    // The phone typed "Grace  " (the page reports it trimmed) and chose UK.
    shown.set('c1', valueKeyOf('Grace  '));
    shown.set('c3', valueKeyOf(['uk']));
    const page = (changes: Record<string, unknown>): typeof model => ({
      ...model,
      groups: model.groups.map(group => ({ ...group, controls: group.controls.map(control => (control.id in changes ? { ...control, value: changes[control.id] as any } : control)) })),
    });
    expect(phoneValueChangesOf(page({ c1: 'Grace', c3: 'uk' }), shown)).toEqual([]);
    expect(shown.get('c7:position')).toBe('12');
    expect(phoneValueChangesOf(page({ c1: 'Grace', c3: 'uk', c4: false, c5: '2026-11-01' }), shown)).toEqual([
      { id: 'c4', value: [], key: '' },
      { id: 'c5', value: '2026-11-01', key: '2026-11-01' },
    ]);
    shown.set('c1', valueKeyOf('x'.repeat(600)));
    expect(phoneValueChangesOf(page({ c1: `${'x'.repeat(499)}…`, c3: 'uk' }), shown)).toEqual([]);
  });
});
