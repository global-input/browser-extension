import React from 'react';
import {useGlobalInputApp } from 'global-input-react'; ////global-input-react////
import {AppContainer} from './app-layout';


export enum PAGES {
    LOADING,
    DISPLAY_CACHED_FORM,
    HOME,
    TRANSFER_FORM_DATA,
    ENCRYPTION,
    DECRYPTION,
    PAGE_CONTROL
}

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
                setPage(PAGES.ENCRYPTION);
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
    development.debugMobile(mobile); ////dev-test


    return (<AppContainer title="Global Input App" domain={domain}>
        <mobile.ConnectQR />
    </AppContainer>);
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

