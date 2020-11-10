import presetRules from './preset.json';
import * as storage from '../../storage';
import { FormField, FieldValue } from '../../mobile'

interface NextRule {
    type: string;
}

interface ContentRule {
    element: string,
    textContent?: string;
}
type SelectorRule = string | {
    element: string | string[];
    content?: ContentRule;
    textContent?: string;
}
type DataAttributeRule = string | {
    type: string;
    attributeName?: string;
}

interface Data {
    label?: DataAttributeRule;
    selector?: SelectorRule;
    value?: DataAttributeRule;
}
interface ItemRule {
    selector: SelectorRule;
    data: Data;
    value?: string;
}
interface FieldRule {
    id: string;
    type: string;
    selector: SelectorRule;
    data: Data;
    selectType?: string;
    items?: ItemRule[];
    value?: string;
    label?: string;
    next?: NextRule;
    matchingRule?: FieldRule;
}
interface FormIdRule {
    selector: SelectorRule;
    data: Data;
}
export interface FormRule {
    title: string;
    fields: FieldRule[];
    formid?: FormIdRule;
    id?: string;
    type?: string;
}
interface HostNamesRule {
    value: string | string[];
}
export interface PageRule {
    hostnames?: HostNamesRule;
    forms: FormRule[];
}
const findPresetRuleByDomain = (domain: string) => {
    for (let rule of presetRules) {
        if (rule.hostnames && rule.hostnames.value) {
            if (Array.isArray(rule.hostnames.value)) {
                for (let hostname of rule.hostnames.value) {
                    if (hostname === domain) {
                        return rule
                    }
                }
            }
            else if (typeof rule.hostnames.value === 'string') {
                if (rule.hostnames.value === domain) {
                    return rule;
                }
            }
        }
    }
    return null;
};

export const findRuleByDomain = (domain: string) => {
    const ruleString = storage.getPageControlRule(domain);
    if (ruleString) {
        try {
            const rule = JSON.parse(ruleString);
            if (rule) {
                return rule;
            }
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    return findPresetRuleByDomain(domain);
};

const ruleToString = (rule: PageRule) => {
    const ruleToEdit = {
        forms: rule.forms
    } //take away hostnames
    return JSON.stringify(ruleToEdit, null, 2);
}

export const getRulesForEdit = (domain: string) => {
    const ruleString = storage.getPageControlRule(domain);
    if (ruleString) {
        return ruleString;
    }
    const rule = findPresetRuleByDomain(domain);
    return rule ? ruleToString(rule) : '';
};
export const getPresetRuleByIndexForEdit = (index: number) => {
    if (index < 0 || index >= presetRules.length) {
        return "";
    }
    return ruleToString(presetRules[index]);
}

export const saveRule = (domain: string, content: string) => {
    storage.savePageControlRule(domain, content);
}
export const removeRule = (domain: string) => {
    storage.removePageControlRule(domain);
}



const mapFieldId = (filedRule: FieldRule) => {
    if (filedRule.type === 'list' || filedRule.type === 'info' || filedRule.type === 'picker' || filedRule.type === 'select') {
        return undefined;
    }
    else {
        return filedRule.id;
    }
};
const mapFieldValue = (filedRule: FieldRule) => {
    if (filedRule.type === 'picker') {
        return typeof filedRule.value === 'undefined' ? filedRule?.items?.length && filedRule.items[0].value : filedRule.value;
    }
    else {
        return filedRule.value;
    }
};
export const mapField = (fieldRule: FieldRule): FormField => {
    return {
        id: mapFieldId(fieldRule),
        label: fieldRule.label,
        type: fieldRule.type,
        items: fieldRule.items,
        selectType: fieldRule.selectType,
        value: mapFieldValue(fieldRule),
    };
}



type OnFieldInput = (fieldRule: FieldRule, value: FieldValue) => void;


export const buildFormFieldsFieldRules = (form: FormRule, onFieldInput: OnFieldInput) => {
    return form.fields.map((fieldRule: FieldRule) => {
        return {
            id: mapFieldId(fieldRule),
            label: fieldRule.label,
            type: fieldRule.type,
            items: fieldRule.items,
            selectType: fieldRule.selectType,
            value: mapFieldValue(fieldRule),
            operations: {
                onInput: (value: FieldValue) => onFieldInput(fieldRule, value)
            }
        };
    });
};

const getDomainsFromRule = (rule: PageRule): string[] => {
    if (rule.hostnames && rule.hostnames.value) {
        if (Array.isArray(rule.hostnames.value)) {
            return rule.hostnames.value;
        }
        else if (typeof rule.hostnames.value === 'string') {
            return [rule.hostnames.value];
        }
    }
    return [];
}

export interface RuleSelectionItem {
    value: string;
    label: string;
}
export const buildSelectionItems = (): RuleSelectionItem[] => {
    return presetRules.map((rule, i) => {
        return {
            label: getDomainsFromRule(rule)[0],
            value: `${i}`
        }
    });
};
