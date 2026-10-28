import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPageControlAgent } from './agent';
import { CHECK_MS } from './watch';
import type { PageModel } from '../../shared/pageControlMessages';

const visible = (element: Element) => !element.closest('[hidden]');
const settle = () => new Promise(resolve => setTimeout(resolve, CHECK_MS + 100));
const labels = (model: PageModel) => model.groups.flatMap(group => group.controls.map(control => control.label));

let reports: PageModel[];
let listening: boolean;
const start = (html: string) => {
  document.body.innerHTML = html;
  reports = [];
  listening = true;
  const agent = createPageControlAgent(document, visible, async model => {
    reports.push(model);
    return listening;
  });
  agent.analyse({ expectedHost: document.location.host });
  return agent;
};

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('keeping up with the page', () => {
  it('reports a dialog that opens, once', async () => {
    const agent = start('<button>Open</button>');
    document.body.insertAdjacentHTML('beforeend', '<div role="dialog" aria-modal="true" aria-label="Cookies"><button>Accept</button></div>');
    document.body.insertAdjacentHTML('beforeend', '<p>more text</p>');
    await settle();
    expect(reports).toHaveLength(1);
    expect(reports[0].scope).toBe('dialog');
    expect(labels(reports[0])).toEqual(['Accept']);
    agent.stop();
  });

  it('reports a value the page filled in after the phone’s input', async () => {
    const agent = start('<form><select aria-label="Country"><option value="uk">UK</option><option value="fr">France</option></select><input aria-label="Currency" value="GBP"></form>');
    document.querySelector('select')!.addEventListener('change', () => {
      document.querySelector('input')!.value = 'EUR';
    });
    const reply = agent.analyse({ expectedHost: document.location.host });
    const countryId = reply.status === 'success' ? reply.model.groups[0].controls[0].id : '';
    agent.act({ expectedHost: document.location.host, id: countryId, value: 'fr' });
    await settle();
    expect(reports).toHaveLength(1);
    expect(reports[0].groups[0].controls.map(control => control.value)).toEqual(['fr', 'EUR']);
    agent.stop();
  });

  it('reports nothing when nothing an operator sees changed', async () => {
    const agent = start('<button>Save</button><div id="clock"></div>');
    document.getElementById('clock')!.setAttribute('data-time', '12:01');
    document.getElementById('clock')!.className = 'tick';
    await settle();
    expect(reports).toHaveLength(0);
    agent.stop();
  });

  it('stops when the panel no longer listens, or is stopped', async () => {
    const agent = start('<button>One</button>');
    listening = false;
    document.body.insertAdjacentHTML('beforeend', '<button>Two</button>');
    await settle();
    expect(reports).toHaveLength(1);
    expect(agent.isWatching()).toBe(false);
    document.body.insertAdjacentHTML('beforeend', '<button>Three</button>');
    await settle();
    expect(reports).toHaveLength(1);

    const again = start('<button>One</button>');
    again.handle({ messageType: 'pagecontrol/stop' }, vi.fn());
    document.body.insertAdjacentHTML('beforeend', '<button>Two</button>');
    await settle();
    expect(reports).toHaveLength(0);
  });
});
