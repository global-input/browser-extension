// "Insert into page" for the panel's tools: writes a value into the field that has focus in the
// active tab, with the same host check as sign-in. Also reads that field, for in-place tools.
import { activeTabId, chromePagePort, readFocused } from '../../adapters/chromePage';

export type ToolMessage = { tone: 'success' | 'warn' | 'info'; text: string } | null;

type FillReply = Awaited<ReturnType<typeof chromePagePort.fillFocused>>;

export const insertMessage = (label: string, domain: string, reply: FillReply): ToolMessage => {
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

export const insertIntoPage = async (label: string, value: string, domain: string): Promise<ToolMessage> => {
  if (!value) {
    return { tone: 'warn', text: `${label} is empty.` };
  }
  const tabId = await activeTabId();
  if (tabId === null || !domain) {
    return { tone: 'warn', text: 'Open a web page in this window first.' };
  }
  return insertMessage(label, domain, await chromePagePort.fillFocused(tabId, value, domain));
};

export const copyToClipboard = async (label: string, value: string): Promise<ToolMessage> => {
  try {
    await navigator.clipboard.writeText(value);
    return { tone: 'success', text: `Copied ${label}.` };
  } catch (error) {
    return { tone: 'warn', text: 'Could not copy. Use Insert instead.' };
  }
};

// The text of the focused field on the page, or a message saying why there is none.
export const readFromPage = async (domain: string): Promise<{ value: string } | { message: ToolMessage }> => {
  const tabId = await activeTabId();
  if (tabId === null || !domain) {
    return { message: { tone: 'warn', text: 'Open a web page in this window first.' } };
  }
  const reply = await readFocused(tabId, domain);
  if (!reply) {
    return { message: { tone: 'warn', text: 'This tab cannot be used. Reload the page and try again.' } };
  }
  if (reply.status === 'success' && reply.value !== undefined) {
    return { value: reply.value };
  }
  switch (reply.reason) {
    case 'host-mismatch':
      return { message: { tone: 'warn', text: `The active tab is no longer on ${domain}.` } };
    case 'empty':
      return { message: { tone: 'warn', text: 'The focused field on the page is empty.' } };
    default:
      return { message: { tone: 'warn', text: 'Click into a text field on the page first, then press the button again.' } };
  }
};
