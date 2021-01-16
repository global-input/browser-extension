import React from 'react';
import {PopupWindow,ConnectedInstruction,Tips,TipTitle,TopBar,Footer,AppContent} from './components';
import {useMobile,ConnectWidget, DisconnectButton} from './mobile';
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



    return (
        <PopupWindow>
            <ConnectWidget mobile={mobile} />
            <ConnectedInstruction mobile={mobile} center={true}>
                <TopBar>
                    Connected
                </TopBar>
                <AppContent>
                    <Tips>
                <TipTitle>Press the buttons displayed on your mobile</TipTitle>
                </Tips>
                </AppContent>
            </ConnectedInstruction>
            <Footer>
            <DisconnectButton mobile={mobile}>Disconnect</DisconnectButton>
            </Footer>

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