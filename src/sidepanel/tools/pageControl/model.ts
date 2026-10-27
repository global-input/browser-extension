// Pure parts of the Page control tool: which screen is shown, where the site's rule comes from,
// how a rule is checked before saving, and how the controls found on the page are described.
import type { FormField } from 'global-input-react';

export type PageControlScreen = { name: 'control' } | { name: 'edit'; draft: string } | { name: 'preset'; draft: string };

export type RuleSource = 'saved' | 'built-in' | 'none';

export const ruleSourceOf = (savedRule: string | null, foundRule: unknown): RuleSource =>
  savedRule ? 'saved' : foundRule ? 'built-in' : 'none';

export const RULE_SOURCE_TEXT: Record<RuleSource, string> = {
  saved: 'Using your saved page rule',
  'built-in': 'Using the built-in page rule for this site',
  none: 'No page rule for this site yet',
};

// An empty rule is allowed: saving it removes the saved rule (the built-in one applies again).
export const validateRuleContent = (content: string): string | null => {
  if (!content.trim()) {
    return null;
  }
  try {
    JSON.parse(content);
    return null;
  } catch (error) {
    return `The rule is not valid JSON: ${(error as Error).message}`;
  }
};

const KIND_NAMES: Record<string, string> = {
  text: 'Text field',
  secret: 'Password field',
  button: 'Button',
  list: 'List',
  picker: 'Choice',
  select: 'Choice',
  info: 'Information',
};

export const describeControl = (field: FormField) => ({
  label: String(field.label ?? field.id ?? 'Unnamed'),
  kind: (field.type && KIND_NAMES[field.type]) || 'Field',
});
