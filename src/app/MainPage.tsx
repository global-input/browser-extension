import React from 'react';


import { AppFooter, MessageContainer, MessageButton, MessageLink, RowCenter } from './app-layout';
import {PopupWindow} from './components';
import {useMobile,ConnectWidget} from './mobile';
interface Props {
    domain: string;
    transferFormData: () => void;
    encryption: () => void;
    decryption: () => void;
    pageControl: () => void;
}
const MainPage: React.FC<Props> = ({ domain, transferFormData, encryption, decryption, pageControl}) => {
    const initData={
        form:{
            title:"Please Select",
            fields:Object.values(FIELDS)
        }
    };
    const mobile = useMobile(initData,true);
    mobile.setOnchange(({field}) => {
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
            <MessageLink href="https://github.com/global-input/browser-extension">Source Code</MessageLink>
        </AppFooter>
    )

    return (
        <PopupWindow>

            <ConnectWidget mobile={mobile} />
        </PopupWindow>

    );
}
/*
<MessageContainer>
                You can now operate on your mobile.
            </MessageContainer>
            <RowCenter>{mobile.disconnectButton}</RowCenter>
        </mobile.ControlledContainer>
*/

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