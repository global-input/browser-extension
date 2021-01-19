import React, { useCallback, useState } from 'react';
import * as storage from './storage';
import {LoadingContentStatus} from './LoadingContentStatus';
import {DisplayCachedFields} from './form-data-transfer/DisplayCachedFields';
import {FormDataTransfer} from './form-data-transfer';
import {MobileEncryption} from './mobile-encryption';
import {MobileDecryption} from './mobile-decryption';
import {MainPage} from './MainPage';
import {PageControl} from './page-control';
import EditRule from './edit-rule';
import LoadFromPreset from './load-from-preset';


enum PAGES {
    LOADING,
    DISPLAY_CACHED_FORM,
    MAIN_PAGE,
    TRANSFER_FORM_DATA,
    ENCRYPTION,
    DECRYPTION,
    PAGE_CONTROL,
    EDIT_RULE,
    LOAD_FROM_PRESET
}

const App = () => {
    const [page, setPage] = useState(PAGES.LOADING);
    const [domain, setDomain] = useState<string>('');
    const [ruleContentToEdit,setRuleContentToEdit]=useState<string>('');


    const [cacheKey, setCacheKey] = useState(null);

    const mainPage = useCallback(() => setPage(PAGES.MAIN_PAGE), []);
    const transferFormData = useCallback(() => setPage(PAGES.TRANSFER_FORM_DATA), []);
    const encryption = useCallback(() => setPage(PAGES.ENCRYPTION), []);
    const decryption = useCallback(() => setPage(PAGES.DECRYPTION), []);
    const displayCachedForm = useCallback(() => setPage(PAGES.DISPLAY_CACHED_FORM), []);
    const pageControl = useCallback(() => setPage(PAGES.PAGE_CONTROL), []);
    const editRule = (content?: string) => {
          if(content){
            setRuleContentToEdit(content);
          }
          setPage(PAGES.EDIT_RULE);
    };



    const onReceivedPageStatus = useCallback((message) => {
        if (message && message.status === 'success' && message.host) {
            setDomain(message.host);


            if (message.content.key && message.host) {
                setCacheKey(message.content.key);
                displayCachedForm();
            }
            else {
                storage.clearCacheFields();
                mainPage();
            }
        }
        else {
            storage.clearCacheFields();
            mainPage();
        }
    }, [displayCachedForm, mainPage]);


    switch (page) {
        case PAGES.LOADING:
            return (<LoadingContentStatus onReceivedPageStatus={onReceivedPageStatus} />);
        case PAGES.DISPLAY_CACHED_FORM:
            return (<DisplayCachedFields cacheKey={cacheKey} domain={domain} back={mainPage} />);
        case PAGES.TRANSFER_FORM_DATA:
            return (<FormDataTransfer domain={domain} back={mainPage} />);
        case PAGES.ENCRYPTION:
            return (<MobileEncryption back={mainPage} domain={domain} />);
        case PAGES.DECRYPTION:
            return (<MobileDecryption back={mainPage} domain={domain} />);
        case PAGES.MAIN_PAGE:
            return (<MainPage domain={domain} transferFormData={transferFormData} encryption={encryption}
                decryption={decryption} pageControl={pageControl}/>);
        case PAGES.PAGE_CONTROL:
            return (<PageControl back={mainPage} domain={domain} editRule={editRule}/>);
        case PAGES.EDIT_RULE:
             return (<EditRule back={mainPage} domain={domain} />);
        case PAGES.LOAD_FROM_PRESET:
             return (<LoadFromPreset editRule={editRule} domain={domain} />)
        default:
            return null;
    }
};
export default App;
