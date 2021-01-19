import React, { useState, useCallback } from 'react';
import PageControl from './PageControl';
import {LoadRules} from './load-rule';
import ProcessRule from './ProcessRule';
import EditRule from './edit-rule';

import { PageRule, FormRule } from './rules';

enum PAGES {
    LOAD_RULE,
    PROCESS_RULE,
    PAGE_CONTROL,
    EDIT_RULE,
};
interface Props {
    domain: string;
    back: () => void;
}
export const PageControlHome: React.FC<Props> = ({ domain, back }) => {
    const [page, setPage] = useState(PAGES.LOAD_RULE);
    const [form, setForm] = useState<FormRule | null>(null);
    const [rule, setRule] = useState<PageRule | null>(null);

    const processRule = useCallback((rule: PageRule) => {
        setRule(rule);
        setPage(PAGES.PROCESS_RULE);
    }, []);

    const editRule = useCallback(() => setPage(PAGES.EDIT_RULE), []);
    const pageControl = useCallback((form: FormRule) => {
        setForm(form);
        setPage(PAGES.PAGE_CONTROL);
    }, []);
    const loadRule = useCallback(() => setPage(PAGES.LOAD_RULE), []);
    switch (page) {
        case PAGES.LOAD_RULE:
            return (<LoadRules back={back} domain={domain} processRule={processRule} editRule={editRule} />)
        case PAGES.PROCESS_RULE:
            return rule ? (<ProcessRule back={back} domain={domain} rule={rule} editRule={editRule} pageControl={pageControl} />) : null;
        case PAGES.PAGE_CONTROL:
            return form ? (<PageControl back={back} domain={domain} form={form} editRule={editRule} loadRule={loadRule} />) : null;
        case PAGES.EDIT_RULE:
            return (<EditRule back={loadRule} domain={domain} />);
        default:
    }
    return null;
};
