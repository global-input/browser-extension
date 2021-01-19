import React, { useState } from 'react';
import Editor from './Editor';
import LoadFromPreset from '../load-from-preset';
import * as rules from '../page-control/rules';

enum PAGES {
    EDIT,
    LOAD_FROM_PRESET
}
interface Props {
    back: () => void;
    domain: string;
}

export const EditRule: React.FC<Props> = ({ back, domain }) => {
    const [page, setPage] = useState(PAGES.EDIT);
    const [content, setContent] = useState<string>(() => rules.getRulesForEdit(domain));
    const saveRule = (content: string) => {
        if (content) {
            rules.saveRule(domain, content);
        }
        else {
            rules.removeRule(domain);
        }
        setContent(content);
        back();
    };
    const toEdit = () => setPage(PAGES.EDIT);
    const loadLoadFromPreset = () => setPage(PAGES.LOAD_FROM_PRESET);
    const loadRule = (content: string) => {
        setContent(content);
        setPage(PAGES.EDIT);
    }

    switch (page) {
        case PAGES.EDIT:
            return (<Editor back={back} domain={domain} initialContent={content} saveRule={saveRule} loadLoadFromPreset={loadLoadFromPreset} />);
        // case PAGES.LOAD_FROM_PRESET:
        //     return (<LoadFromPreset back={toEdit} domain={domain} loadRule={loadRule} />)
        default:
    }
    return null;


}

export default EditRule