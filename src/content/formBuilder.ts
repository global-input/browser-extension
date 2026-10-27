// Finds a form on the page from a page rule, and writes values into it.
// Ported unchanged in behaviour from the original public/content.js.
import type { DataRule, ElementRule, FieldRule, FormRule, MobileForm, PageRule, SelectorRule, ValueRule } from '../shared/pageRule';

type Container = Document | Element;

export interface PageField {
  id: string;
  label: string | null;
  type?: string;
  matchingRule: FieldRule;
  formElement: Element;
  value?: unknown;
  selectType?: string;
  items?: { label: unknown; value: unknown; element: Element }[];
  confirm?: { formElement: Element };
}

export interface PageForm {
  id: string;
  title: string;
  fields: PageField[];
}

const matchesRule = (rule: ElementRule, element: Element) => {
  if (rule.textContent && element.textContent !== rule.textContent) {
    return false;
  }
  if (rule.attributeName && rule.attributeValue && element.getAttribute(rule.attributeName) !== rule.attributeValue) {
    return false;
  }
  return true;
};

const matchElementsByRule = (rule: ElementRule, container: Container): Element[] => {
  const matching: Element[] = [];
  const collect = (elements: NodeListOf<Element>) => {
    elements.forEach(element => {
      if (!matchesRule(rule, element)) {
        return;
      }
      if (rule.content) {
        if (matchElementsByRule(rule.content, element).length) {
          matching.push(element);
        }
      } else {
        matching.push(element);
      }
    });
  };
  if (Array.isArray(rule.element)) {
    for (const selector of rule.element) {
      const elements = container.querySelectorAll(selector);
      if (elements.length) {
        collect(elements);
        break;
      }
    }
  } else {
    collect(container.querySelectorAll(rule.element));
  }
  return matching;
};

const selectElements = (selector: SelectorRule, container: Container): Element[] =>
  typeof selector === 'object' ? matchElementsByRule(selector, container) : Array.from(container.querySelectorAll(selector));

const selectElement = (selector: SelectorRule, container: Container): Element | null => selectElements(selector, container)[0] || null;

const getItemValue = (rule: ValueRule, element: Element | null): string | null => {
  if (typeof rule === 'string') {
    return rule;
  }
  if (rule.selector && element) {
    element = selectElement(rule.selector, element);
  }
  if (!element) {
    return null;
  }
  if (rule.type === 'attribute' && rule.attributeName) {
    return element.getAttribute(rule.attributeName);
  }
  if (rule.type === 'textContent') {
    return element.textContent;
  }
  if (rule.type === 'value') {
    return (element as HTMLInputElement).value;
  }
  return null;
};

const getData = (rule: DataRule, element: Element) => {
  let target: Element | null = element;
  if (rule.selector) {
    target = selectElement(rule.selector, element);
    if (!target) {
      return null;
    }
  }
  return {
    label: rule.label ? getItemValue(rule.label, target) : null,
    value: rule.value ? getItemValue(rule.value, target) : null,
  };
};

const buildListField = (rule: FieldRule, container: Container): PageField | null => {
  const listElement = selectElement(rule.selector, container);
  if (!listElement) {
    return null;
  }
  let listData: { label: string | null } = { label: null };
  if (rule.data) {
    const data = getData(rule.data, listElement);
    if (!data) {
      return null;
    }
    listData = data;
  }
  const items: { label: unknown; value: unknown; element: Element }[] = [];
  for (const itemRule of rule.items || []) {
    for (const element of selectElements(itemRule.selector, listElement)) {
      const itemData = getData(itemRule.data, element);
      if (itemData && !items.some(item => item.value === itemData.value)) {
        items.push({ label: itemData.label, value: itemData.value, element });
      }
    }
  }
  if (!items.length) {
    return null;
  }
  return { id: rule.id, type: rule.type, label: listData.label, selectType: rule.selectType, matchingRule: rule, items, formElement: listElement };
};

const buildInfoField = (rule: FieldRule, container: Container): PageField | null => {
  const element = selectElement(rule.selector, container);
  if (!element) {
    return null;
  }
  const data = rule.data ? getData(rule.data, element) : null;
  return { id: rule.id, label: data ? data.label : null, type: rule.type, matchingRule: rule, value: data ? data.value : null, formElement: element };
};

const buildField = (rule: FieldRule, container: Container): PageField | null => {
  const element = selectElement(rule.selector, container);
  if (!element) {
    return null;
  }
  let label: string | null = rule.id;
  if (rule.data) {
    const data = getData(rule.data, element);
    label = data ? data.label : null;
  }
  const field: PageField = { id: rule.id, label, type: rule.type, matchingRule: rule, formElement: element };
  if (rule.confirm) {
    const confirmElement = selectElement(rule.confirm.selector, container);
    if (confirmElement) {
      field.confirm = { formElement: confirmElement };
    }
  }
  return field;
};

const isListType = (type?: string) => type === 'list' || type === 'picker' || type === 'select';

export const buildForm = (rule: FormRule, doc: Document = document): PageForm | null => {
  let container: Container = doc;
  if (rule.type === 'iframe') {
    const iframe = doc.querySelector('iframe');
    if (!iframe || !iframe.contentWindow || !iframe.contentWindow.document) {
      return null;
    }
    container = iframe.contentWindow.document;
  }
  const host = doc.location ? doc.location.host : '';
  const form: PageForm = { id: `###username###@${host}`, title: `${host} Sign In`, fields: [] };
  for (const fieldRule of rule.fields) {
    let field: PageField | null;
    if (isListType(fieldRule.type)) {
      field = buildListField(fieldRule, container);
    } else if (fieldRule.type === 'info') {
      field = buildInfoField(fieldRule, container);
    } else {
      field = buildField(fieldRule, container);
    }
    if (!field) {
      return null;
    }
    form.fields.push(field);
  }
  if (rule.formid) {
    const formidElement = selectElement(rule.formid.selector, container);
    if (formidElement) {
      const formid = getItemValue(rule.formid.data.value, formidElement);
      if (formid) {
        form.id = form.id.replace('###username###', formid);
      }
    }
  }
  if (rule.title) {
    form.title = rule.title;
  }
  return form;
};

// The first form of the rule that is complete on this page.
export const buildPageForm = (rule: PageRule | null | undefined, doc: Document = document): PageForm | null => {
  if (!rule || !rule.forms) {
    return null;
  }
  for (const formRule of rule.forms) {
    const form = buildForm(formRule, doc);
    if (form) {
      return form;
    }
  }
  return null;
};

export const toMobileForm = (form: PageForm): MobileForm => ({
  id: form.id,
  title: form.title,
  fields: form.fields.map(field => {
    const mobileField: MobileForm['fields'][number] & { matchingRule?: FieldRule } = {
      id: field.id,
      label: field.label,
      type: field.type,
      matchingRule: field.matchingRule,
    };
    if (isListType(field.type)) {
      mobileField.items = (field.items || []).map(item => ({ value: item.value, label: item.label }));
      mobileField.selectType = field.selectType;
    } else if (field.type === 'info') {
      mobileField.value = field.value;
    }
    return mobileField;
  }),
});

/* React (and similar frameworks) wraps the element's own value setter to track
   changes, so "element.value = x" is seen as no change and onChange never fires.
   Calling the prototype's native setter updates the value the way typing does. */
const setNativeValue = (element: Element, value: unknown) => {
  const view = (element.ownerDocument && element.ownerDocument.defaultView) || window;
  let prototype: object = view.HTMLInputElement.prototype;
  if (element instanceof view.HTMLTextAreaElement) {
    prototype = view.HTMLTextAreaElement.prototype;
  } else if (element instanceof view.HTMLSelectElement) {
    prototype = view.HTMLSelectElement.prototype;
  }
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  } else {
    (element as HTMLInputElement).value = value as string;
  }
};

const fireInputEvents = (element: Element) => {
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: false, cancelable: true }));
};

// Returns the field written to, or null when the form has no such field.
export const setFieldValue = (form: PageForm, fieldId: string, value: unknown): PageField | null => {
  for (const field of form.fields) {
    if (field.id !== fieldId) {
      continue;
    }
    if (field.type === 'button') {
      const button = field.formElement as HTMLButtonElement;
      if (button.disabled) {
        button.disabled = false;
      }
      button.click();
    } else if (field.type === 'list') {
      if (Array.isArray(value) && value.length) {
        const item = (field.items || []).find(it => it.value === value[0]);
        if (item) {
          (item.element as HTMLElement).click();
        }
      }
    } else {
      setNativeValue(field.formElement, value);
      fireInputEvents(field.formElement);
      if (field.confirm) {
        setNativeValue(field.confirm.formElement, value);
        fireInputEvents(field.confirm.formElement);
      }
    }
    return field;
  }
  return null;
};
