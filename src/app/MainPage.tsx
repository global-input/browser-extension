import React, { useCallback } from 'react';
import { useMobile } from './mobile';

import { ControlLayout, AppFooter, MessageContainer, MessageButton, MessageLink } from './app-layout';


export enum PAGES {
    LOADING,
    DISPLAY_CACHED_FORM,
    MAIN_PAGE,
    TRANSFER_FORM_DATA,
    ENCRYPTION,
    DECRYPTION,
    PAGE_CONTROL,
    EDIT_CONNECTION_SETTINGS
}

interface Props {
    domain: string;
    setPage: (page: PAGES) => void;
}
const MainPage: React.FC<Props> = ({ setPage, domain }) => {
    const mobile = useMobile({
        action: "input",
        dataType: "form",
        form: {
            title: "Please Select",
            fields: Object.values(FIELDS)
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
    const toEditConnectionSettings = useCallback(() => setPage(PAGES.EDIT_CONNECTION_SETTINGS), [setPage]);
    const NotConnected = () => (
        <AppFooter>
            <MessageButton label="Settings" onClick={toEditConnectionSettings} />
            <MessageLink href="https://github.com/global-input/browser-extension">Source Code</MessageLink>
        </AppFooter>

    )

    return (
        <ControlLayout title="Global Input App" mobile={mobile} notConnected={<NotConnected />}>
            <MessageContainer>
                You can now operate on your mobile
        </MessageContainer>
        </ControlLayout>
    );
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
        label: 'Page Control',
        viewId: "row3"
    }
};

export default MainPage;