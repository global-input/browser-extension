// Page rules the user saved for a host (sign-in's "Save as page rule"). There are no built-in
// rules in the side panel: without a saved rule, sign-in finds the form automatically.
// Stored where the popup keeps its rules (extension.control.<host>), as {forms}; anything that
// isn't a rule with forms counts as no rule.
import type { PageRule } from '../../shared/pageRule';
import type { Ports } from '../core/signInController';

const PREFIX = 'extension.control.';

const savedRule = (host: string): PageRule | null => {
  try {
    const rule = JSON.parse(localStorage.getItem(PREFIX + host) || 'null');
    return rule && Array.isArray(rule.forms) && rule.forms.length ? rule : null;
  } catch (error) {
    return null;
  }
};

export const pageRulesPort: Ports['rules'] = {
  find: savedRule,
  // Adds the rule's forms to the saved rule for the host (a two-step sign-in ends up with one
  // form per step).
  save: (host, rule) => {
    const forms = [...(savedRule(host)?.forms || [])];
    for (const form of rule.forms) {
      if (!forms.some(other => JSON.stringify(other.fields) === JSON.stringify(form.fields))) {
        forms.push(form);
      }
    }
    try {
      localStorage.setItem(PREFIX + host, JSON.stringify({ forms }, null, 2));
    } catch (error) {
      // Storage full or blocked: the form is still found automatically next time.
    }
  },
};

// Sites with a saved sign-in rule, for Settings → Sites.
export const savedRuleHosts = (): string[] => {
  try {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(PREFIX) && savedRule(key.slice(PREFIX.length)))
      .map(key => key.slice(PREFIX.length))
      .sort();
  } catch (error) {
    return [];
  }
};

export const forgetRule = (host: string) => {
  try {
    localStorage.removeItem(PREFIX + host);
  } catch (error) {
    // Nothing to forget.
  }
};
