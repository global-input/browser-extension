// Page rules for a host: the user's own rules first, then the built-in ones. The same rules
// the popup's Page Control uses (src/app/page-control/rules).
import { findRuleByDomain } from '../../app/page-control/rules';
import type { PageRule } from '../../shared/pageRule';
import type { Ports } from '../core/signInController';

export const pageRulesPort: Ports['rules'] = {
  find: host => (findRuleByDomain(host) as PageRule | null) || null,
};
