import { describe, expect, it } from 'vitest';
import { analysisStateOf, controlCount, describeMore } from './analysis';
import type { PageModel } from '../../../shared/pageControlMessages';

const model: PageModel = {
  host: 'a.example',
  title: 'A',
  scope: 'page',
  groups: [
    { id: 'g1', title: 'Form', controls: [{ id: 'c1', kind: 'text', label: 'Name' }, { id: 'c2', kind: 'button', label: 'Go' }] },
    { id: 'g2', title: 'Page', controls: [{ id: 'c3', kind: 'link', label: 'Home' }] },
  ],
  more: { links: 0, buttons: 0, fields: 0 },
};

describe('page analysis in the panel', () => {
  it('turns the page reply into a state', () => {
    expect(analysisStateOf(null, 1)).toEqual({ status: 'unreachable' });
    expect(analysisStateOf({ status: 'error', reason: 'host-mismatch' }, 1)).toEqual({ status: 'other-site' });
    expect(analysisStateOf({ status: 'success', model }, 5)).toEqual({ status: 'done', model, at: 5 });
  });

  it('counts the controls and describes what was left out', () => {
    expect(controlCount(model)).toBe(3);
    expect(describeMore({ links: 0, buttons: 0, fields: 0 })).toBe('');
    expect(describeMore({ links: 7, buttons: 0, fields: 0 })).toBe('7 links');
    expect(describeMore({ links: 7, buttons: 1, fields: 2 })).toBe('2 fields, 1 button and 7 links');
  });
});
