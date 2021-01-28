import React from 'react';
import {ConnectedPage, MoreInfo} from './components';
import {useMobile, DisconnectButton} from './mobile';
interface Props {
    domain: string;
    transferFormData: () => void;
    encryption: () => void;
    decryption: () => void;
    pageControl: () => void;
}
export const MainPage: React.FC<Props> = ({ domain, transferFormData, encryption, decryption, pageControl}) => {

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

    const footer=(
        <DisconnectButton mobile={mobile}>Disconnect</DisconnectButton>
    );

    return (
        <ConnectedPage mobile={mobile} domain={domain} title="This extension is now connected to your mobile"
        footer={footer}>
            <MoreInfo>Press the buttons displayed on your mobile to operate.</MoreInfo>
        </ConnectedPage>
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
const initData={
    form:{
        title:"Please Select",
        views: {
            viewIds: {
                row1:{
                    style:{
                        display:'flex',
                        justifyContent:'center',
                        width:'100%',
                    }
                },
                row2:{
                    style:{
                        display:'flex',
                        justifyContent:'space-between',
                        padding:20,
                        width:'100%',
                    }
                }
            }
        },
        fields:Object.values(FIELDS)
    }
};
