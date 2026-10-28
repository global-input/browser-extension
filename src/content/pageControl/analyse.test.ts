import { beforeEach, describe, expect, it } from 'vitest';
import { analysePage } from './analyse';
import { createRegistry } from './registry';
import { createPageControlAgent } from './agent';
import type { PageModel } from '../../shared/pageControlMessages';

// jsdom has no layout: an element counts as visible unless it or an ancestor is marked hidden.
const visible = (element: Element) => !element.closest('[hidden], [style*="display: none"]');

const analyse = (html: string, maxControls?: number) => {
  document.body.innerHTML = html;
  return analysePage(document, { visible, registry: createRegistry(), maxControls });
};

const labels = (model: PageModel) => model.groups.map(group => [group.title, group.controls.map(control => `${control.label}:${control.kind}`)]);

beforeEach(() => {
  document.title = 'Example';
  document.body.innerHTML = '';
});

describe('page analysis', () => {
  it('finds a form with its fields, names and submit button', () => {
    const model = analyse(`
      <form aria-label="Delivery address">
        <label for="n">Full name</label><input id="n" value="Ada">
        <input name="postcode" placeholder="Postcode">
        <label>Country <select><option value="uk">United Kingdom</option><option value="fr" selected>France</option></select></label>
        <label><input type="checkbox" checked> Save for next time</label>
        <textarea aria-label="Notes"></textarea>
        <button>Continue</button>
      </form>`);
    expect(labels(model)).toEqual([
      ['Delivery address', ['Full name:text', 'Postcode:text', 'Country:choice', 'Save for next time:toggle', 'Notes:multiline', 'Continue:button']],
    ]);
    const [name, , country, save, , button] = model.groups[0].controls;
    expect(name.value).toBe('Ada');
    expect(country).toMatchObject({ value: 'fr', options: [{ value: 'uk', label: 'United Kingdom' }, { value: 'fr', label: 'France' }] });
    expect(save.value).toBe(true);
    expect(button.primary).toBe(true);
  });

  it('never reads a secret value', () => {
    const model = analyse(`
      <form><input type="password" aria-label="Password" value="hunter2">
      <input autocomplete="one-time-code" aria-label="Code" value="123456">
      <input name="card_cvv" aria-label="CVV" value="999"></form>`);
    const controls = model.groups[0].controls;
    expect(controls.map(control => control.kind)).toEqual(['secret', 'secret', 'secret']);
    expect(JSON.stringify(model)).not.toMatch(/hunter2|123456|999/);
  });

  it('keeps a fieldset inside a form in that form', () => {
    const model = analyse(`<form aria-label="Checkout"><input aria-label="Name"><fieldset><legend>Gift</legend><input type="checkbox" aria-label="Wrap it"></fieldset><button>Pay</button></form>`);
    expect(labels(model)).toEqual([['Checkout', ['Name:text', 'Wrap it:toggle', 'Pay:button']]]);
  });

  it('leaves out elements moved off the page', () => {
    document.body.innerHTML = '<button>Shown</button><button>Skip to content</button>';
    const [shown, skip] = Array.from(document.querySelectorAll('button'));
    shown.getBoundingClientRect = () => ({ left: 10, top: 10, right: 90, bottom: 30, width: 80, height: 20 }) as DOMRect;
    skip.getBoundingClientRect = () => ({ left: -10000, top: 10, right: -9920, bottom: 30, width: 80, height: 20 }) as DOMRect;
    const model = analysePage(document, { visible, registry: createRegistry() });
    expect(model.groups[0].controls.map(control => control.label)).toEqual(['Shown']);
  });

  it('makes one choice of a radio group, named by its legend', () => {
    const model = analyse(`
      <form><fieldset><legend>Delivery speed</legend>
        <label><input type="radio" name="speed" value="std" checked> Standard</label>
        <label><input type="radio" name="speed" value="fast"> Express</label>
      </fieldset></form>`);
    expect(model.groups[0].controls).toEqual([
      expect.objectContaining({ kind: 'choice', label: 'Delivery speed', value: 'std', options: [{ value: 'std', label: 'Standard' }, { value: 'fast', label: 'Express' }] }),
    ]);
  });

  it('leaves out hidden, disabled, inert and decorative elements', () => {
    const model = analyse(`
      <button>Shown</button>
      <button hidden>Hidden</button>
      <button disabled>Disabled</button>
      <div aria-hidden="true"><button>Decorative</button></div>
      <div inert><a href="/x">Inert</a></div>
      <input type="hidden" name="token" value="abc">
      <button aria-label=""></button>
      <a href="/a"><span role="button">Inner</span></a>`);
    expect(model.groups.flatMap(group => group.controls.map(control => control.label))).toEqual(['Shown', 'Inner']);
  });

  it('limits the analysis to an open modal dialog', () => {
    const model = analyse(`
      <button>Behind the dialog</button>
      <div role="dialog" aria-modal="true" aria-labelledby="t"><h2 id="t">Cookies</h2><button>Accept all</button><button>Reject all</button></div>`);
    expect(model.scope).toBe('dialog');
    expect(labels(model)).toEqual([['Cookies', ['Accept all:button', 'Reject all:button']]]);
  });

  it('ranks forms above navigation and counts what it leaves out', () => {
    const links = Array.from({ length: 10 }, (_, i) => `<a href="/p${i}">Page ${i}</a>`).join('');
    const model = analyse(`<nav aria-label="Main menu">${links}</nav><main><form aria-label="Search"><input type="search" aria-label="Search terms"><button>Go</button></form></main>`, 5);
    expect(model.groups[0].title).toBe('Search');
    expect(model.groups.flatMap(group => group.controls)).toHaveLength(5);
    expect(model.more).toEqual({ links: 7, buttons: 0, fields: 0 });
  });

  it('merges repeated links and tells repeated names apart', () => {
    const model = analyse(`<a href="/home">Home</a><a href="/home">Home</a><button>Delete</button><button>Delete</button>`);
    expect(model.groups[0].controls.map(control => control.label)).toEqual(['Home', 'Delete', 'Delete (2)']);
  });

  it('treats script-only links as buttons, and describes media and sliders', () => {
    const model = analyse(`<a href="#" >Open menu</a><video aria-label="Product tour"></video><input type="range" min="0" max="10" step="2" value="4" aria-label="Volume">`);
    const controls = model.groups.flatMap(group => group.controls);
    expect(controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Open menu', kind: 'button' }),
        expect.objectContaining({ label: 'Product tour', kind: 'media' }),
        expect.objectContaining({ label: 'Volume', kind: 'range', value: 4, min: 0, max: 10, step: 2 }),
      ])
    );
  });

  it('finds controls inside open shadow roots', () => {
    document.body.innerHTML = '<x-widget></x-widget>';
    const root = document.querySelector('x-widget')!.attachShadow({ mode: 'open' });
    root.innerHTML = '<button>Inside the component</button>';
    const model = analysePage(document, { visible, registry: createRegistry() });
    expect(model.groups[0].controls[0].label).toBe('Inside the component');
  });

  it('finds controls inside frames from the same site', () => {
    document.body.innerHTML = '<button>Outside</button><iframe></iframe>';
    const frame = document.querySelector('iframe')!.contentDocument!;
    frame.body.innerHTML = '<form aria-label="Comment"><textarea aria-label="Your comment"></textarea><button>Post</button></form>';
    const model = analysePage(document, { visible, registry: createRegistry() });
    expect(labels(model)).toEqual([
      ['Comment', ['Your comment:multiline', 'Post:button']],
      ['Page', ['Outside:button']],
    ]);
  });

  it('includes more controls when asked to show more', () => {
    const links = Array.from({ length: 40 }, (_, i) => `<a href="/p${i}">Page ${i}</a>`).join('');
    document.body.innerHTML = links;
    const agent = createPageControlAgent(document, visible, async () => true);
    const count = (limit?: number) => {
      const reply = agent.analyse({ expectedHost: document.location.host, limit });
      return reply.status === 'success' ? [reply.model.groups[0].controls.length, reply.model.more.links] : [];
    };
    expect(count()).toEqual([30, 10]);
    expect(count(60)).toEqual([40, 0]);
    expect(count(-5)).toEqual([1, 39]);
    agent.stop();
  });

  it('keeps the same id for the same element across analyses', () => {
    document.body.innerHTML = '<button>One</button>';
    const registry = createRegistry();
    const first = analysePage(document, { visible, registry }).groups[0].controls[0].id;
    document.body.insertAdjacentHTML('afterbegin', '<button>Zero</button>');
    const second = analysePage(document, { visible, registry }).groups[0].controls.find(control => control.label === 'One')!.id;
    expect(second).toBe(first);
  });
});

describe('page control agent', () => {
  it('answers only for the expected host, and highlights known controls', () => {
    document.body.innerHTML = '<button>Press</button>';
    const agent = createPageControlAgent(document, visible);
    expect(agent.analyse({ expectedHost: 'other.example' })).toEqual({ status: 'error', reason: 'host-mismatch' });
    const reply = agent.analyse({ expectedHost: document.location.host });
    expect(reply.status).toBe('success');
    const id = reply.status === 'success' ? reply.model.groups[0].controls[0].id : '';
    Element.prototype.scrollIntoView = () => undefined;
    expect(agent.highlight({ expectedHost: document.location.host, id })).toEqual({ status: 'success' });
    expect(document.getElementById('global-input-page-control-highlight')).not.toBeNull();
    expect(agent.highlight({ expectedHost: document.location.host, id: 'c999' })).toEqual({ status: 'error', reason: 'gone' });
  });
});
