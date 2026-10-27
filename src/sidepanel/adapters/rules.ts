// Page rules for a host: the user's own rules first, then the built-in ones. The same rules
// the Page control tool uses and edits (src/app/page-control/rules).
import { findRuleByDomain, saveRule } from '../../app/page-control/rules';
import { getPageControlRule } from '../../app/storage';
import type { PageRule } from '../../shared/pageRule';
import type { Ports } from '../core/signInController';

const userRule = (host: string): PageRule | null => {
  try {
    return JSON.parse(getPageControlRule(host) || 'null');
  } catch (error) {
    return null;
  }
};

export const pageRulesPort: Ports['rules'] = {
  find: host => (findRuleByDomain(host) as PageRule | null) || null,
  // Adds the rule's forms to the user's rule for the host, or to a copy of the built-in one
  // (a two-step sign-in ends up with one form per step). Stored as {forms}, the format the
  // rule editor shows.
  save: (host, rule) => {
    const existing = userRule(host) || (findRuleByDomain(host) as PageRule | null);
    const forms = existing && Array.isArray(existing.forms) ? [...existing.forms] : [];
    for (const form of rule.forms) {
      if (!forms.some(other => JSON.stringify(other.fields) === JSON.stringify(form.fields))) {
        forms.push(form);
      }
    }
    saveRule(host, JSON.stringify({ forms }, null, 2));
  },
};
