import React, { useCallback, useState, useEffect } from 'react';
import { FormField, useGlobalInputApp } from 'global-input-react'; ////global-input-react////


import LoadingContentStatus from './LoadingContentStatus';
import DisplayCachedFields from './form-data-transfer/DisplayCachedFields';
import FormDataTransfer from './form-data-transfer';
import MobileEncryption from './mobile-encryption';

import * as appLayout from './app-layout';
import * as appSettings from './appSettings';

////main////

enum PAGES {
    LOADING,
    DISPLAY_CACHED_FORM,
    HOME,
    TRANSFER_FORM_DATA,
    ENCRYPTION,
    DECRYPTION,
    PAGE_CONTROL
}
const App = () => {
    const [page, setPage] = useState(PAGES.LOADING);
    const [domain, setDomain] = useState<string>('');
    const [cachedFields, setCachedFields] = useState<FormField[]>([]);
    const onReceivedPageStatus = useCallback((host: string, cachedFields: FormField[]) => {
        setDomain(host);
        setCachedFields(cachedFields);
        setPage(cachedFields.length ? PAGES.DISPLAY_CACHED_FORM : PAGES.HOME);
    }, []);
    const toHome = () => setPage(PAGES.HOME);

    switch (page) {
        case PAGES.LOADING:
            return (<LoadingContentStatus onReceivedPageStatus={onReceivedPageStatus} />);
        case PAGES.DISPLAY_CACHED_FORM:
            return (<DisplayCachedFields fields={cachedFields} domain={domain} back={toHome} />);
        case PAGES.TRANSFER_FORM_DATA:
            return (<FormDataTransfer domain={domain} back={toHome} />);
        case PAGES.ENCRYPTION:
            return <
        case PAGES.HOME:
            return <Home domain={domain} setPage={setPage} />
        default:
            return null;
    }
};


interface HomeProps {
    domain: string;
    setPage: (page: PAGES) => void;
}
const Home: React.FC<HomeProps> = ({ setPage, domain }) => {

    const mobile = useGlobalInputApp({
        initData: {
            action: "input",
            dataType: "form",
            form: {
                title: "Please Select",
                fields: Object.values(FIELDS)
            }
        }


    });

    mobile.setOnchange(({ field }) => {
        switch (field.id) {
            case FIELDS.transfer.id:
                setPage(PAGES.TRANSFER_FORM_DATA);
                break;
            case FIELDS.encryption.id:
                setPage(PAGES.DECRYPTION);
                break;
            case FIELDS.decryption.id:
                setPage(PAGES.DECRYPTION);
                break;
            case FIELDS.control.id:
                setPage(PAGES.PAGE_CONTROL);
                break;
            default:
        }
    });
    ////dev-test codeData


    return (<appLayout.AppContainer title="Global Input App" domain={domain}>
        <mobile.ConnectQR />
    </appLayout.AppContainer>);
}


const FIELDS = {
    transfer: {
        id: 'form-data-transfer',
        type: "button",
        label: "Transfer Form Data",
        viewId: "row1"
    },
    encryption: {
        id: 'mobile-encryption',
        type: 'button',
        label: 'Encryption',
        viewId: "row2"
    },
    decryption: {
        id: 'mobile-decryption',
        type: 'button',
        label: 'Decryption',
        viewId: "row2"
    },
    control: {
        id: "page-control",
        type: 'button',
        label: 'Sign In/Page Control',
        viewId: "row3"
    }
};

export default App;
