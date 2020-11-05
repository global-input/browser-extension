
import { generateRandomString, encrypt, decrypt } from 'global-input-react';

import * as storage from '../../storage';
import {FormField} from '../../mobile';


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

export const saveCacheFields = (domain?: string, formFields?: FormField[]) => {
    if (!domain || !formFields) {
        return null;
    }
    const numberOfNotEmptyFields = formFields.reduce((count, f) => f.value ? count + 1 : count, 0);
    if (numberOfNotEmptyFields < 2) {
        return null;
    }
    const {key,encryptedContent}=encryptWithNewKey(formFields);
    storage.setCacheFields(domain,encryptedContent);
    return key;

};

export const loadCacheFields = (domain: string, key: string): FormField[] => {
   const encryptedContent=storage.getCacheFields(domain);
    if (!encryptedContent) {
        return [];
    }
    const contentBlob = decryptWithNewKey(encryptedContent, key);
    if (!contentBlob) {
            storage.clearCacheFields(domain);
            return [];
    }
    return JSON.parse(contentBlob);
};
