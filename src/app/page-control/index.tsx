import React, { useState } from 'react';
import PageControl from './PageControl';
import EditRule from './edit-rule';


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

    const toEditRule = () => setPage(PAGES.EDIT_RULE);
    const toPageControl=()=>setPage(PAGES.PAGE_CONTROL);
    switch (page) {
        case PAGES.PAGE_CONTROL:
            return <PageControl back={back} domain={domain} toEditRule={toEditRule} />
        case PAGES.EDIT_RULE:
            return <EditRule back={toPageControl} domain={domain}/>
        default:
    }
    return null;
};


export default PageControlHome;