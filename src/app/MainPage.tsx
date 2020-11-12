import React from 'react';
import { useMobile } from './mobile';

import { AppFooter, MessageContainer, MessageButton, MessageLink } from './app-layout';

interface Props {
    domain: string;
    transferFormData: () => void;
    encryption: () => void;
    decryption: () => void;
    pageControl: () => void;
    editConnectionSettings: () => void;
}
const MainPage: React.FC<Props> = ({ domain, transferFormData, encryption, decryption, pageControl, editConnectionSettings, }) => {
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
                transferFormData();
                break;
            case FIELDS.encryption.id:
                encryption();
                break;
            case FIELDS.decryption.id:
                decryption();
                break;
            case FIELDS.control.id:
                pageControl();
                break;
            default:
        }
    });

    const NotConnected = () => (
        <AppFooter>
            <MessageButton label="Settings" onClick={editConnectionSettings} />
            <MessageLink href="https://github.com/global-input/browser-extension">Source Code</MessageLink>
        </AppFooter>
    )

    return (
        <mobile.ControlledContainer title="Global Input App" domain={domain} notConnected={<NotConnected />}>
            <MessageContainer>
                You can now operate on your mobile.
        </MessageContainer>

        </mobile.ControlledContainer>
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