
import { useGlobalInputApp } from 'global-input-react'; ////global-input-react////
import { InitData, FieldValue, ConnectOptions, FormField, GlobalInputData } from 'global-input-react'; ////global-input-react//// //types
////main////

import * as storage from '../storage';


export const useMobile = (initData: InitData | (() => InitData)): GlobalInputData => {
    const mobile = useGlobalInputApp({
        initData,
        options: storage.getConnectOption() as ConnectOptions
    });
    ////dev-test codeData
    return mobile;
};

export type { FormField, FieldValue, GlobalInputData };
