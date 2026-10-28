import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPageControlAgent } from './agent';
import type { PageControl } from '../../shared/pageControlMessages';

const visible = (element: Element) => !element.closest('[hidden]');
const host = () => document.location.host;

let agent: ReturnType<typeof createPageControlAgent>;
const analyse = (html: string) => {
  document.body.innerHTML = html;
  agent = createPageControlAgent(document, visible);
  const reply = agent.analyse({ expectedHost: host() });
  if (reply.status !== 'success') throw new Error('not analysed');
  return (label: string) => reply.model.groups.flatMap(group => group.controls).find(control => control.label === label) as PageControl;
};
const act = (control: PageControl, value?: any) => agent.act({ expectedHost: host(), id: control.id, value });

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('carrying out phone input', () => {
  it('types into fields so the page notices', () => {
    const find = analyse('<form><input aria-label="Name"><textarea aria-label="Notes"></textarea><input type="password" aria-label="Password"></form>');
    const name = document.querySelector('input')!;
    const onInput = vi.fn();
    name.addEventListener('input', onInput);
    expect(act(find('Name'), 'Ada')).toEqual({ status: 'success' });
    expect(name.value).toBe('Ada');
    expect(onInput).toHaveBeenCalled();
    act(find('Notes'), 'Two\nlines');
    expect(document.querySelector('textarea')!.value).toBe('Two\nlines');
    act(find('Password'), 'hunter2');
    expect((document.querySelector('input[type=password]') as HTMLInputElement).value).toBe('hunter2');
  });

  it('chooses options, radio buttons and toggles', () => {
    const find = analyse(`<form>
      <select aria-label="Country"><option value="uk">UK</option><option value="fr">France</option></select>
      <select multiple aria-label="Extras"><option value="a">A</option><option value="b">B</option></select>
      <fieldset><legend>Speed</legend><label><input type="radio" name="s" value="std" checked> Standard</label><label><input type="radio" name="s" value="fast"> Express</label></fieldset>
      <label><input type="checkbox"> Gift</label></form>`);
    act(find('Country'), 'fr');
    expect(document.querySelector<HTMLSelectElement>('select')!.value).toBe('fr');
    act(find('Extras'), ['a', 'b']);
    expect(Array.from(document.querySelector<HTMLSelectElement>('select[multiple]')!.selectedOptions).map(option => option.value)).toEqual(['a', 'b']);
    act(find('Speed'), 'fast');
    expect(document.querySelector<HTMLInputElement>('input[value=fast]')!.checked).toBe(true);
    act(find('Gift'), true);
    expect(document.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(true);
    act(find('Gift'), true);
    expect(document.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(true);
    act(find('Gift'), false);
    expect(document.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(false);
  });

  it('presses buttons, and hands links for a new tab to the panel', () => {
    const find = analyse('<button>Save</button><a href="https://example.com/help" target="_blank">Help</a>');
    const onClick = vi.fn();
    document.querySelector('button')!.addEventListener('click', onClick);
    expect(act(find('Save'))).toEqual({ status: 'success' });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(act(find('Help'))).toEqual({ status: 'success', newTab: 'https://example.com/help' });
  });

  it('refuses another site, removed controls and disabled ones', () => {
    const find = analyse('<button>Save</button><button>Later</button>');
    const save = find('Save');
    expect(agent.act({ expectedHost: 'other.example', id: save.id })).toEqual({ status: 'error', reason: 'host-mismatch' });
    document.querySelectorAll('button')[1].disabled = true;
    expect(act(find('Later'))).toEqual({ status: 'error', reason: 'disabled' });
    document.querySelector('button')!.remove();
    expect(act(save)).toEqual({ status: 'error', reason: 'gone' });
  });

  it('scrolls the page, only for the expected site', () => {
    analyse('<p>Long page</p>');
    const scrollBy = vi.fn();
    window.scrollBy = scrollBy as any;
    expect(agent.pageAction({ expectedHost: host(), action: 'down' })).toEqual({ status: 'success' });
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ top: expect.any(Number) }));
    expect(scrollBy.mock.calls[0][0].top).toBeGreaterThan(0);
    expect(agent.pageAction({ expectedHost: 'other.example', action: 'up' })).toEqual({ status: 'error', reason: 'host-mismatch' });
  });
});
