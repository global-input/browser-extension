import React, { useState } from 'react';
import PageControl from './PageControl';
import EditRule from './EditRule';

enum PAGES {
    PAGE_CONTROL,
    EDIT_RULE,
};
interface Props {
    domain: string;
    back: () => void;
}
const PageControlHome: React.FC<Props> = ({ domain, back }) => {
    const [page, setPage] = useState(PAGES.PAGE_CONTROL);
    const editRule = () => setPage(PAGES.EDIT_RULE);
    switch (page) {
        case PAGES.PAGE_CONTROL:
            return <PageControl back={back} domain={domain} editRule={editRule} />
        case PAGES.EDIT_RULE:
            return <EditRule back={back} domain={domain} />
        default:
    }
    return null;
};


export default PageControlHome;