import React, { useCallback, useState } from 'react';
import * as storage from './storage';
import {LoadingContentStatus} from './LoadingContentStatus';
import {DisplayCachedFields} from './form-data-transfer/DisplayCachedFields';
import {FormDataTransfer} from './form-data-transfer';
import {MobileEncryption} from './mobile-encryption';
import {MobileDecryption} from './mobile-decryption';
import {MainPage} from './MainPage';
import {PageControl} from './page-control';
import {EditRule} from './edit-rule';
import LoadFromPreset from './load-from-preset';


enum PAGE_NAME {
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
interface Page{
    name:PAGE_NAME;
    content?:string|null;
}

const App = () => {
    const [page, setPage] = useState<Page>({name:PAGE_NAME.LOADING,content:null});
    const [domain, setDomain] = useState<string>('');
    const mainPage = useCallback(() => {
        storage.clearCacheFields();
        setPage({name:PAGE_NAME.MAIN_PAGE})
    }, []);
    const transferFormData = useCallback(() => setPage({name:PAGE_NAME.TRANSFER_FORM_DATA}), []);
    const encryption = useCallback(() => setPage({name:PAGE_NAME.ENCRYPTION}), []);
    const decryption = useCallback(() => setPage({name:PAGE_NAME.DECRYPTION}), []);
    const displayCachedForm = useCallback((cacheKey:string) => setPage({name:PAGE_NAME.DISPLAY_CACHED_FORM, content:cacheKey}), []);
    const pageControl = useCallback(() => setPage({name:PAGE_NAME.PAGE_CONTROL}), []);
    const loadFromPreset=useCallback(() => setPage({name:PAGE_NAME.LOAD_FROM_PRESET}), []);
    const editRule = (content?: string) => {
          setPage({name:PAGE_NAME.EDIT_RULE, content});
    };



    const onReceivedPageStatus = useCallback((message:any) => {
        if (message && message.status === 'success' && message.host) {
            setDomain(message.host);


            if (message.content.key && message.host) {
                displayCachedForm(message.content.key);
            }
            else {
                mainPage();
            }
        }
        else {
            mainPage();
        }
    }, [displayCachedForm, mainPage]);


    switch (page.name) {
        case PAGE_NAME.LOADING:
            return (<LoadingContentStatus onReceivedPageStatus={onReceivedPageStatus} />);
        case PAGE_NAME.DISPLAY_CACHED_FORM:
            return (<DisplayCachedFields cacheKey={page.content} domain={domain} back={mainPage} />);
        case PAGE_NAME.TRANSFER_FORM_DATA:
            return (<FormDataTransfer domain={domain} back={mainPage} />);
        case PAGE_NAME.ENCRYPTION:
            return (<MobileEncryption back={mainPage} domain={domain} />);
        case PAGE_NAME.DECRYPTION:
            return (<MobileDecryption back={mainPage} domain={domain} />);
        case PAGE_NAME.MAIN_PAGE:
            return (<MainPage domain={domain} transferFormData={transferFormData} encryption={encryption}
                decryption={decryption} pageControl={pageControl}/>);
        case PAGE_NAME.PAGE_CONTROL:
            return (<PageControl back={mainPage} domain={domain} editRule={editRule}/>);
        case PAGE_NAME.EDIT_RULE:
             return (<EditRule back={mainPage} domain={domain} loadFromPreset={loadFromPreset} contentToEdit={page.content}/>);
        case PAGE_NAME.LOAD_FROM_PRESET:
             return (<LoadFromPreset editRule={editRule} domain={domain} />)
        default:
            return null;
    }
};
export default App;
