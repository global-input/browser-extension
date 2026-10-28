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

  it('plays, pauses, moves and turns up video', () => {
    document.body.innerHTML = '<video aria-label="Tour"></video>';
    const video = document.querySelector('video')!;
    let paused = true;
    Object.defineProperty(video, 'paused', { get: () => paused });
    Object.defineProperty(video, 'duration', { value: 90 });
    video.play = vi.fn(() => {
      paused = false;
      return Promise.resolve();
    });
    video.pause = vi.fn(() => {
      paused = true;
    });
    agent = createPageControlAgent(document, visible);
    const reply = agent.analyse({ expectedHost: host() });
    const tour = reply.status === 'success' ? reply.model.groups[0].controls[0] : ({} as PageControl);
    expect(tour.media).toMatchObject({ playing: false, duration: 90 });
    agent.act({ expectedHost: host(), id: tour.id, media: { type: 'toggle' } });
    expect(video.play).toHaveBeenCalled();
    agent.act({ expectedHost: host(), id: tour.id, media: { type: 'toggle' } });
    expect(video.pause).toHaveBeenCalled();
    agent.act({ expectedHost: host(), id: tour.id, media: { type: 'seek', seconds: 500 } });
    expect(video.currentTime).toBe(90);
    agent.act({ expectedHost: host(), id: tour.id, media: { type: 'volume', percent: 0 } });
    expect(video.muted).toBe(true);
    agent.act({ expectedHost: host(), id: tour.id, media: { type: 'volume', percent: 40 } });
    expect([video.muted, video.volume]).toEqual([false, 0.4]);
  });

  it('moves a slider built from ARIA with the keys, as a keyboard user would', () => {
    const find = analyse('<div role="slider" tabindex="0" aria-label="Zoom" aria-valuemin="0" aria-valuemax="10" aria-valuenow="2"></div>');
    const slider = document.querySelector('[role=slider]')!;
    slider.addEventListener('keydown', event => {
      const now = Number(slider.getAttribute('aria-valuenow'));
      const next = { ArrowRight: now + 1, ArrowLeft: now - 1, Home: 0, End: 10 }[(event as KeyboardEvent).key];
      if (next !== undefined) slider.setAttribute('aria-valuenow', String(Math.max(0, Math.min(10, next))));
    });
    expect(act(find('Zoom'), 7)).toEqual({ status: 'success' });
    expect(slider.getAttribute('aria-valuenow')).toBe('7');
    act(find('Zoom'), 0);
    expect(slider.getAttribute('aria-valuenow')).toBe('0');
    const stuck = analyse('<div role="slider" aria-label="Fixed" aria-valuenow="3"></div>');
    expect(act(stuck('Fixed'), 5)).toEqual({ status: 'error', reason: 'unsupported' });
  });

  it('types into an editor marked role="textbox"', () => {
    const find = analyse('<div role="textbox" aria-multiline="true" aria-label="Message"><div contenteditable="true"></div></div>');
    const message = find('Message');
    expect(message.kind).toBe('multiline');
    // The editable area inside is part of the editor, not a second control.
    expect(find('Text')).toBeUndefined();
    expect(act(message, 'Hello')).toEqual({ status: 'success' });
    expect(document.querySelector('[contenteditable]')!.textContent).toBe('Hello');
  });
});
