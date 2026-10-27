// Page rules: how to find a form's fields on a page. The format is the one in
// src/app/page-control/rules/preset.json and in rules users write in the rule editor.

export interface ElementRule {
  element: string | string[];
  textContent?: string;
  attributeName?: string;
  attributeValue?: string;
  content?: ElementRule;
}

export type SelectorRule = string | ElementRule;

export type ValueRule =
  | string
  | {
      type: 'attribute' | 'textContent' | 'value' | string;
      attributeName?: string;
      selector?: SelectorRule;
    };

export interface DataRule {
  selector?: SelectorRule;
  label?: ValueRule;
  value?: ValueRule;
}

export interface FieldRule {
  id: string;
  type?: string;
  selector: SelectorRule;
  data?: DataRule;
  confirm?: { selector: SelectorRule };
  items?: { selector: SelectorRule; data: DataRule }[];
  selectType?: string;
  next?: { type: string };
}

export interface FormRule {
  id?: string;
  title?: string;
  type?: string;
  fields: FieldRule[];
  formid?: { selector: SelectorRule; data: { value: ValueRule } };
}

export interface PageRule {
  hostnames?: { value: string | string[] };
  forms: FormRule[];
}

// A form as the phone sees it (no DOM elements).
export interface MobileField {
  id: string;
  label?: string | null;
  type?: string;
  value?: unknown;
  items?: { value: unknown; label: unknown }[];
  selectType?: string;
}

export interface MobileForm {
  id: string;
  title: string;
  fields: MobileField[];
}
