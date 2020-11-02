
import { useGlobalInputApp, generateRandomString, encrypt, decrypt } from 'global-input-react'; ////global-input-react////
import { InitData, ConnectOptions, FormField,GlobalInputData } from 'global-input-react'; ////global-input-react//// //types
////main////
import * as chromeExtension from './chromeExtensionUtil';
import {setCacheFields,getCacheFields,clearCacheFields,getURL,getAPIKey} from './storage';


const getOption = () => {
    const option: ConnectOptions = {
    };
    const url = getURL();
    if (url) {
        option.url = url;
    }
    const apikey = getAPIKey();
    if (apikey) {
        option.apikey = apikey;
    }
    return option;
}


const useMobile = (initData: InitData | (() => InitData)) => {
    const mobile = useGlobalInputApp({ initData, options: getOption() });
    ////dev-test codeData
    return mobile;
};
const generateEncryptionKey = () => {
    return generateRandomString(20);
};
const cacheKeySuffix='Tjg0MfNGYr';
const encryptWithNewKey=(content:object)=>{
    const key = generateEncryptionKey();
    const contentBlob = JSON.stringify(content);
    const encryptedContent = encrypt(contentBlob, key + cacheKeySuffix);
    return {
        key,
        encryptedContent
    }
};
const decryptWithNewKey=(content:string,key:string)=>{
    try {
    decrypt(content, key + cacheKeySuffix);
    }
    catch(error){
        return null;
    }
}

const saveCacheFields = (domain?: string, formFields?: FormField[]) => {
    if (!domain || !formFields) {
        return null;
    }
    const numberOfNotEmptyFields = formFields.reduce((count, f) => f.value ? count + 1 : count, 0);
    if (numberOfNotEmptyFields < 2) {
        return null;
    }
    const {key,encryptedContent}=encryptWithNewKey(formFields);
    setCacheFields(domain,encryptedContent);
    return key;

};

const loadCacheFields = (domain: string, key: string): FormField[] => {
   const encryptedContent=getCacheFields(domain);
    if (!encryptedContent) {
        return [];
    }
    const contentBlob = decryptWithNewKey(encryptedContent, key);
    if (!contentBlob) {
            clearCacheFields(domain);
            return [];
    }
    return JSON.parse(contentBlob);
};




export type { FormField,GlobalInputData};

export {
    useMobile,
    saveCacheFields,
    loadCacheFields,
    clearCacheFields,
    chromeExtension
    };
