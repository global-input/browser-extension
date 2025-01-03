
import { generateRandomString, encrypt, decrypt } from 'global-input-react';

import * as storage from '../../storage';
import { FormField } from 'global-input-mobile';


const generateEncryptionKey = () => {
    return generateRandomString(20);
};
const cacheKeySuffix = 'Tjg0MfNGYr';
const encryptWithNewKey = (content: object) => {
    const key = generateEncryptionKey();
    const contentBlob = JSON.stringify(content);
    const encryptedContent = encrypt(contentBlob, key + cacheKeySuffix);
    return {
        key,
        encryptedContent
    }
};
const decryptWithNewKey = (content: string, key: string) => {
    try {
        return decrypt(content, key + cacheKeySuffix);
    }
    catch (error) {
        return null;
    }
}

export const saveCacheFields = (domain?: string, formFields?: FormField[]) => {
    if (!domain || !formFields) {
        return null;
    }
    const { key, encryptedContent } = encryptWithNewKey(formFields);
    storage.setCacheFields(domain, encryptedContent);
    return key;

};

export const loadCacheFields = (domain: string, key: string): FormField[] => {
    const encryptedContent = storage.getCacheFields(domain);
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

export const saveRemainingFieldsToCache=(domain:string,formField:FormField, formFields:FormField[])=>{

    let fieldListInString="";
    const notCopiedFields:FormField[]=[];
    formFields.forEach(f=>{
        if(f!==formField && f.value){
            notCopiedFields.push(f);
            if(fieldListInString){
                fieldListInString+=", ";

            }
            fieldListInString+=f.label;
        }
    });
    if(notCopiedFields.length){
        const key = saveCacheFields(domain, notCopiedFields);
        let message='Considering that the browser will close the extension window when you interact with the current page to paste the content in your clipboard, ';
        if(notCopiedFields.length>1){
            message+=`the values of ${fieldListInString} are `
        }
        else{
            message+=`the value of ${fieldListInString} is `
        }
        message+='cached (persisted) to make ';
        if(notCopiedFields.length>1){
            message+='them ';
        }
        else{
            message+='it ';
        }
        message+='available when you re-open the extension window. Press the "Back" button if you want to clear the cache.';
        return {key,message};
    }
    else{
        return {key:null,message:null};
    }
}