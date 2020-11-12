
import { useGlobalInputApp } from 'global-input-react'; ////global-input-react////
import { InitData, FieldValue, ConnectOptions, FormField, GlobalInputData } from 'global-input-react'; ////global-input-react//// //types
////main////

import * as storage from '../storage';

let client: string | null = null;
export const useMobile = (initData: InitData | (() => InitData)): GlobalInputData => {
    const connectionSettings = storage.loadConnectionSettings();
    const options: ConnectOptions = {
        url: connectionSettings.url,////use your own server"
        apikey: connectionSettings.apikey,
        securityGroup: connectionSettings.securityGroup
    };
    const mobile = useGlobalInputApp({ initData, options, codeAES: connectionSettings.codeKey });
    ////dev-test codeData
    return mobile;
};

export type { FormField, FieldValue, GlobalInputData };
