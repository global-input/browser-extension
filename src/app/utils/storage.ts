const URL = "iterative.globalInputApp.url";
export const getURL = () => localStorage.getItem(URL);
export const setURL = (url: string) => {
    url = url.trim();
    if (url) {
        localStorage.setItem(URL, url);
    }
    else {
        localStorage.removeItem(URL);
    }
};

const API_KEY = "iterative.globalInputApp.apikey";

export const getAPIKey = () => localStorage.getItem(API_KEY);
export const setAPIKey = (apiKey: string) => {
    apiKey = apiKey.trim();
    if (apiKey) {
        localStorage.setItem(API_KEY, apiKey);
    }
    else {
        localStorage.removeItem(API_KEY);
    }
};


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
