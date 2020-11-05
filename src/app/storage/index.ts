const URL = "iterative.globalInputApp.url";
const getURL = () => localStorage.getItem(URL);
const setURL = (url: string|null|undefined) => {
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
const setAPIKey = (apiKey: string|null|undefined) => {
    apiKey = apiKey?.trim();
    if (apiKey) {
        localStorage.setItem(API_KEY, apiKey);
    }
    else {
        localStorage.removeItem(API_KEY);
    }
};
interface ConnectionSettings {
    url?:string|null;
    apikey?:string|null;
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
    return option;
}

export const saveConnectionSettings = (settings:ConnectionSettings) =>{
    setURL(settings.url);
    setAPIKey(settings.apikey);
}

export const loadConnectionSettings=():ConnectionSettings=>{
    let url=getURL();
    let apikey=getAPIKey();
    return {
        url:url?url:"https://globalinput.co.uk",
        apikey:apikey?apikey:"k7jc3QcMPKEXGW5UC"
    };

}


const CACHE_FIELDS='extension.content.cacheFields.';
const CACHE_TIME='extension.content.cachedTime.';

export const clearCacheFields = (domain?: string) => {
    try {
            if (domain) {
                localStorage.removeItem(CACHE_FIELDS+domain);
                localStorage.removeItem(CACHE_TIME+domain);
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
export const setCacheFields=(domain:string,encryptedContent:string) =>{
    const now = (new Date()).getTime();
    localStorage.setItem(CACHE_TIME+domain, `${now}`);
    localStorage.setItem(CACHE_FIELDS+domain, encryptedContent);
};


const cacheTTL = 60000;
export const getCacheFields = (domain: string): string => {
    const cachedTime = localStorage.getItem(CACHE_TIME+domain);
    if (!cachedTime) {
        clearCacheFields();
        return '';
    }
    const now = (new Date()).getTime();
    if ((now - parseInt(cachedTime)) > cacheTTL) {
        clearCacheFields();
        return '';
    }
    const content = localStorage.getItem(CACHE_FIELDS+domain);
    if (!content) {
        clearCacheFields();
        return '';
    }
    return '';
};

const PAGE_CONTROL="extension.control.";
export const removePageControlRule=(domain:string) =>localStorage.removeItem(PAGE_CONTROL+domain);
export const getPageControlRule =(domain:string)=>localStorage.getItem(PAGE_CONTROL+domain);
export const savePageControlRule = (domain:string,pageControlRule:string) => localStorage.setItem(PAGE_CONTROL+domain, pageControlRule);
