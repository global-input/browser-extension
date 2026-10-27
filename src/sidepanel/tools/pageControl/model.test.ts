import { describe, expect, it } from 'vitest';
import { describeControl, ruleSourceOf, validateRuleContent } from './model';

describe('page control model', () => {
  it('tells where the rule comes from', () => {
    expect(ruleSourceOf('{"forms":[]}', { forms: [] })).toBe('saved');
    expect(ruleSourceOf(null, { forms: [] })).toBe('built-in');
    expect(ruleSourceOf(null, null)).toBe('none');
  });

  it('accepts valid JSON or an empty rule, and explains invalid JSON', () => {
    expect(validateRuleContent('{"forms":[]}')).toBeNull();
    expect(validateRuleContent('  ')).toBeNull();
    expect(validateRuleContent('{"forms":')).toMatch(/^The rule is not valid JSON: /);
  });

  it('describes a control by its label and kind', () => {
    expect(describeControl({ id: 'password', label: 'Password', type: 'secret', value: '' })).toEqual({ label: 'Password', kind: 'Password field' });
    expect(describeControl({ id: 'go', type: 'custom', value: '' })).toEqual({ label: 'go', kind: 'Field' });
  });
});
