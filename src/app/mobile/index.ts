
import { useGlobalInputApp } from 'global-input-react'; ////global-input-react////
import { InitData, FieldValue, ConnectOptions, FormField, GlobalInputData } from 'global-input-react'; ////global-input-react//// //types
////main////

import * as storage from '../storage';

let client:string|null=null;
export const useMobile = (initData: InitData | (() => InitData)): GlobalInputData => {
    const connectionSettings=storage.loadConnectionSettings();
    const options:ConnectOptions={
        url:connectionSettings.url,
        apikey:connectionSettings.apikey,
        securityGroup:connectionSettings.securityGroup,
        onSenderConnected: (sender, senders) => {
            client=sender.client;
        },
        onInputPermission: (permissionMessage, senders, deny ) =>{
            if(client && client !== permissionMessage.client){
                deny("Only one client is allowed for each session.");
            }
            else if(senders.length >=1) {
                deny("Another client has already connected.");
            }
        }

    };
    const mobile = useGlobalInputApp({initData,options, codeAES:connectionSettings.codeKey});
    ////dev-test codeData
    return mobile;
};

export type { FormField, FieldValue, GlobalInputData };
