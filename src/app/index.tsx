import React, { useCallback, useState } from 'react';
import {clearCacheFields} from './utils';
import LoadingContentStatus from './LoadingContentStatus';
import DisplayCachedFields from './form-data-transfer/DisplayCachedFields';
import FormDataTransfer from './form-data-transfer';
import MobileEncryption from './mobile-encryption';
import MainPage, { PAGES } from './MainPage';

const App = () => {
    const [page, setPage] = useState(PAGES.LOADING);
    const [domain, setDomain] = useState<string>('');
    const [cacheKey, setCacheKey] = useState(null);

    const onReceivedPageStatus = useCallback((message) => {
        if (message && message.status === 'success' && message.host) {
            setDomain(message.host);
            if (message.content.key && message.host) {
                setCacheKey(message.content.key);
                setPage(PAGES.DISPLAY_CACHED_FORM);
            }
            else {
                clearCacheFields();
                setPage(PAGES.MAIN_PAGE);
            }
        }
        else {
            clearCacheFields();
            setPage(PAGES.MAIN_PAGE);
        }
    }, []);

    const toHome = useCallback(() => setPage(PAGES.MAIN_PAGE), []);

    switch (page) {
        case PAGES.LOADING:
            return (<LoadingContentStatus onReceivedPageStatus={onReceivedPageStatus} />);
        case PAGES.DISPLAY_CACHED_FORM:
            return (<DisplayCachedFields cacheKey={cacheKey} domain={domain} back={toHome} />);
        case PAGES.TRANSFER_FORM_DATA:
            return (<FormDataTransfer domain={domain} back={toHome} />);
        case PAGES.ENCRYPTION:
            return (<MobileEncryption back={toHome} domain={domain} />);
        case PAGES.MAIN_PAGE:
            return <MainPage domain={domain} setPage={setPage} />
        default:
            return null;
    }
};
export default App;
