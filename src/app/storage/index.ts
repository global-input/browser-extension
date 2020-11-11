import { FormField } from 'global-input-react';
const URL = "iterative.globalInputApp.url";
const getURL = () => localStorage.getItem(URL);
const setURL = (url: string | null | undefined) => {
    url = url?.trim();
    if (url) {
        localStorage.setItem(URL, url);
    }
    else {
        localStorage.removeItem(URL);
    }
};

const API_KEY = "iterative.globalInputApp.apikey";

const getAPIKey = () => localStorage.getItem(API_KEY);
const setAPIKey = (apiKey: string | null | undefined) => {
    apiKey = apiKey?.trim();
    if (apiKey) {
        localStorage.setItem(API_KEY, apiKey);
    }
    else {
        localStorage.removeItem(API_KEY);
    }
};

const SECURITY_GROUP="iterative.globalInputApp.securityGroup";
const getSecurityGroup = () => localStorage.getItem(SECURITY_GROUP);
const setSecurityGroup = (securityGroup: string | null | undefined) => {
    securityGroup = securityGroup?.trim();
    if (securityGroup) {
        localStorage.setItem(SECURITY_GROUP, securityGroup);
    }
    else {
        localStorage.removeItem(SECURITY_GROUP);
    }
};

const CODE_KEY="iterative.globalInputApp.codeKey";
const getCodeKey = () => localStorage.getItem(CODE_KEY);
const setCodeKey = (codeKey: string | null | undefined) => {
    codeKey = codeKey?.trim();
    if (codeKey) {
        localStorage.setItem(CODE_KEY, codeKey);
    }
    else {
        localStorage.removeItem(CODE_KEY);
    }
};



interface ConnectionSettings {
    url?: string | null;
    apikey?: string | null;
    securityGroup?: string | null;
    codeAES?: string | null;
}
export const getConnectOption = () => {
    const option: ConnectionSettings = {};
    const url = getURL();////can use your own
    if (url) {
        option.url = url;
    }
    const apikey = getAPIKey();
    if (apikey) {
        option.apikey = apikey;
    }
    const securityGroup = getSecurityGroup();
    if (securityGroup) {
        option.securityGroup = securityGroup;
    }

    const codeAES = getCodeKey();
    if (codeAES) {
        option.codeAES = codeAES;
    }
    return option;
}

export const saveConnectionSettings = (settings: ConnectionSettings) => {
    setURL(settings.url);
    setAPIKey(settings.apikey);
    setSecurityGroup(settings.securityGroup);
    setCodeKey(settings.codeAES);
}

export const loadConnectionSettings = (): ConnectionSettings => {
    const url = getURL();
    const apikey = getAPIKey();
    const securityGroup = getSecurityGroup();
    const codeAES =getCodeKey();
    return {
        url: url ? url : undefined,
        apikey: apikey ? apikey : undefined,
        securityGroup: securityGroup ? securityGroup : undefined,
        codeAES: codeAES ? codeAES: undefined
    };
}


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
    catch (error) {
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
    return '';
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