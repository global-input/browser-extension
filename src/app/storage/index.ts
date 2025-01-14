// @ts-nocheck
import { FormField } from 'global-input-react';

const CACHE_FIELDS = 'extension.content.cacheFields.';
const CACHE_TIME = 'extension.content.cachedTime.';

export const clearCacheFields = (domain?: string) => {
    try {
        if (domain) {
            localStorage.removeItem(CACHE_FIELDS + domain);
            localStorage.removeItem(CACHE_TIME + domain);
            return;
        }
        const keys = Object.keys(localStorage);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.startsWith(CACHE_FIELDS) || key.startsWith(CACHE_TIME)) {
                localStorage.removeItem(key);
            }
        }
    }
    catch (error: any) {
        console.error("failed to clear the cache:" + error);
        console.error(error.stack);
    }
};
export const setCacheFields = (domain: string, encryptedContent: string) => {
    const now = (new Date()).getTime();
    localStorage.setItem(CACHE_TIME + domain, `${now}`);
    localStorage.setItem(CACHE_FIELDS + domain, encryptedContent);
};


const cacheTTL = 60000;
export const getCacheFields = (domain: string): string => {
    const cachedTime = localStorage.getItem(CACHE_TIME + domain);
    if (!cachedTime) {
        clearCacheFields();
        return '';
    }
    const now = (new Date()).getTime();
    if ((now - parseInt(cachedTime)) > cacheTTL) {
        clearCacheFields();
        return '';
    }
    const content = localStorage.getItem(CACHE_FIELDS + domain);
    if (!content) {
        clearCacheFields();
        return '';
    }
    return content;
};

const PAGE_CONTROL = "extension.control.";
export const removePageControlRule = (domain: string) => localStorage.removeItem(PAGE_CONTROL + domain);
export const getPageControlRule = (domain: string) => localStorage.getItem(PAGE_CONTROL + domain);
export const savePageControlRule = (domain: string, pageControlRule: string) => localStorage.setItem(PAGE_CONTROL + domain, pageControlRule);

const FORM_DATA_FIELDS = "extension.forms.fields.";

const getVarForFormFields = (domain: string) => {
    const domainPart = domain ? domain : 'default';
    return FORM_DATA_FIELDS + domainPart;
};


export const loadSavedFormFields = (domain: string) => {
    var fieldString = localStorage.getItem(getVarForFormFields(domain));
    if (!fieldString) {
        return null;
    }
    try {
        const fields = JSON.parse(fieldString);
        if (fields && fields.length > 0) {
            return fields;
        }
    }
    catch (error) {
        console.error(error);
    }
    return null;
};

const removeFormFields = (domain: string) => localStorage.removeItem(getVarForFormFields(domain));

export const saveFormFields = (domain: string, formFields: FormField[]) => {
    if (formFields.length) {
        const formsFieldsToSave = formFields.map(f => ({ ...f, value: undefined }));
        var fieldString = JSON.stringify(formsFieldsToSave);
        localStorage.setItem(getVarForFormFields(domain), fieldString);
    }
    else {
        removeFormFields(domain);
    }
}


const DOMAIN = "iterative.globalInputApp.domain";
export const getDomain = () => localStorage.getItem(DOMAIN);
export const setDomain = (domain: string | null | undefined) => {
    domain = domain?.trim();
    if (domain) {
        localStorage.setItem(DOMAIN, domain);
    }
    else {
        localStorage.removeItem(DOMAIN);
    }
};